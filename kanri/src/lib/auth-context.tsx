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
async function fetchProfile(authUser: SupabaseUser): Promise<User | null> {
  const { data } = await supabase
    .from("users")
    .select("id, name, email, role, company_id, is_active")
    .eq("id", authUser.id)
    .single();

  if (!data || data.is_active === false) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    company_id: data.company_id,
  };
}

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  // 初期値は SSR で確定済みの profile。これにより初回レンダリングから user/role が
  // 入っているので usePermission が即正しい値を返し、編集ボタンが一瞬消える事故が起きない
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(initialUser === null);

  useEffect(() => {
    let cancelled = false;

    // クライアント側では SIGNED_IN / SIGNED_OUT だけ拾えば十分。
    // 初期値は SSR から渡っており、TOKEN_REFRESHED で role が変わることはない
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await fetchProfile(session.user);
        if (!cancelled) {
          setUser(profile);
          setIsLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        if (!cancelled) setUser(null);
      } else if (event === "INITIAL_SESSION") {
        if (!cancelled) setIsLoading(false);
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
    // アカウントロックチェックと認証を並列に投げて、直列の往復待ちをなくす。
    // ロックは login_attempts の読み取り判定のみで signInWithPassword と副作用が独立しているため、
    // 両方の結果が揃ってから「ロック中なら認証成否に関わらずエラー」を返せば安全に高速化できる。
    const [checkData, signInResult] = await Promise.all([
      fetch("/api/auth/login-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "check" }),
      })
        .then((r) => r.json())
        .catch(() => ({ locked: false })),
      supabase.auth.signInWithPassword({ email, password }),
    ]);

    if (checkData.locked) {
      return { error: "ログイン試行回数の上限に達しました。30分後に再度お試しください。" };
    }

    const { error } = signInResult;

    // 成功・失敗の記録（広告流入の検証用）は画面遷移をブロックさせない。
    // GA client_id の取得は最大800msかかりうるので、記録fetchごと裏に回す。
    // 失敗時はこの後すぐ return するため、記録は fire-and-forget で問題ない。
    void (async () => {
      try {
        const attribution = readAttribution() ?? {};
        const gaClientId = await getGaClientId();
        if (gaClientId) attribution.ga_client_id = gaClientId;
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
      } catch {
        // 記録の失敗はログインの成否に影響させない
      }
    })();

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
