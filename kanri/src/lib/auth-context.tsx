"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { getGaClientId } from "@/lib/ga-client-id";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; mfaRequired?: boolean }>;
  verifyMfa: (code: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({}),
  verifyMfa: async () => ({}),
  logout: async () => {},
});

const supabase = createClient();

// signupページと共通のlocalStorageキー。広告流入の経路をログイン時にも紐付ける
const ATTRIBUTION_KEY = "roomly_attribution";

function readAttribution(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  const result: Record<string, string> = {};

  try {
    const stored = window.localStorage.getItem(ATTRIBUTION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      for (const k of [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "gclid",
        "referrer",
        "landing_path",
      ]) {
        const v = parsed[k];
        if (typeof v === "string" && v.length > 0) result[k] = v;
      }
    }
  } catch {
    // パース失敗は無視
  }

  try {
    // ログイン画面に直接UTM付きで来たケースも拾う
    const params = new URLSearchParams(window.location.search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"]) {
      const v = params.get(k);
      if (v && !result[k]) result[k] = v;
    }
    if (!result.referrer && document.referrer) result.referrer = document.referrer;
    if (!result.landing_path) result.landing_path = window.location.pathname + window.location.search;
  } catch {
    // 無視
  }

  return Object.keys(result).length > 0 ? result : null;
}

// Supabase Auth ユーザーから public.users の情報を取得
// 一時的なRLS/ネットワーク失敗で role がフォールバック値に落ちると、admin ユーザーでも
// 編集ボタンが消える事故が起きるので、失敗時は短いリトライを挟む
async function fetchProfile(authUser: SupabaseUser): Promise<User | null> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, company_id, is_active")
      .eq("id", authUser.id)
      .single();

    if (!error && data && data.is_active !== false) {
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        company_id: data.company_id,
      };
    }
    lastError = error;
    if (data?.is_active === false) break; // 明示的にinactiveなら即フォールバック
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }

  // 全リトライ失敗時のみフォールバック。role は最小権限の viewer にして誤って書き込み権を与えない
  console.warn("fetchProfile failed, using fallback (viewer):", lastError);
  const email = authUser.email || "";
  return {
    id: authUser.id,
    name: authUser.user_metadata?.name || email.split("@")[0] || "",
    email,
    role: "viewer",
    company_id: "",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // INITIAL_SESSION の発火タイミングに依らず、マウント直後に getSession() で
    // セッションがあれば即 profile を取得する。これを待たないとレンダリング初回で
    // user=null となり、usePermission が全て false を返して編集ボタン等が消える
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        const profile = await fetchProfile(session.user);
        if (!cancelled) {
          setUser(profile);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user
      ) {
        const profile = await fetchProfile(session.user);
        if (cancelled) return;
        setUser(profile);
        setIsLoading(false);
      } else if (event === "INITIAL_SESSION" && !session) {
        if (!cancelled) setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        if (!cancelled) setUser(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error?: string; mfaRequired?: boolean }> => {
    // アカウントロックチェック
    const checkRes = await fetch("/api/auth/login-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "check" }),
    });
    const checkData = await checkRes.json();
    if (checkData.locked) {
      return { error: "ログイン試行回数の上限に達しました。30分後に再度お試しください。" };
    }

    // 広告計測用にlocalStorage保持中のattributionを同送
    const attribution = readAttribution() ?? {};
    const gaClientId = await getGaClientId();
    if (gaClientId) attribution.ga_client_id = gaClientId;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 成功・失敗どちらも記録する（広告流入の検証に使う）
    await fetch("/api/auth/login-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        action: "record",
        success: !error,
        attribution,
      }),
    });

    if (error) {
      return { error: error.message };
    }

    // MFA要否チェック（失敗してもログインは継続できるよう例外を握りつぶす）
    try {
      const { data: mfaData } = await supabase.auth.mfa.listFactors();
      const totpFactors = mfaData?.totp ?? (mfaData as any)?.all?.filter((f: any) => f.factor_type === "totp") ?? [];
      if (totpFactors.length > 0) {
        return { mfaRequired: true };
      }
    } catch (e) {
      console.error("MFA factors check failed:", e);
    }

    return {};
  };

  const verifyMfa = async (code: string): Promise<{ error?: string }> => {
    const { data: mfaListData } = await supabase.auth.mfa.listFactors();
    const factors = mfaListData?.totp ?? (mfaListData as any)?.all?.filter((f: any) => f.factor_type === "totp") ?? [];
    if (factors.length === 0) return { error: "MFA要素が見つかりません" };

    const factor = factors[0];
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError) return { error: challengeError.message };

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) return { error: "認証コードが正しくありません" };

    return {};
  };

  const logout = async () => {
    setUser(null);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verifyMfa, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
