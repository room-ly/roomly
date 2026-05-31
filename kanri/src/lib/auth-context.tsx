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

// localStorage に最後に取得した profile をキャッシュしておく。
// TOKEN_REFRESHED や一時的なRLS失敗で fetchProfile がコケた時に、admin → viewer に
// 降格して編集ボタンが消える事故を防ぐ。同じ auth user id のものだけ復元する。
const PROFILE_CACHE_KEY = "roomly_profile_cache_v1";

function loadCachedProfile(authUserId: string): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User & { _id?: string };
    if (parsed.id !== authUserId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedProfile(profile: User) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // 保存失敗は無視
  }
}

// Supabase Auth ユーザーから public.users の情報を取得
// 一時的なRLS/ネットワーク失敗で role がフォールバック値に落ちると、admin ユーザーでも
// 編集ボタンが消える事故が起きるので、失敗時はリトライ→キャッシュ→viewerの順でフォールバック
async function fetchProfile(authUser: SupabaseUser): Promise<User | null> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, company_id, is_active")
      .eq("id", authUser.id)
      .single();

    if (!error && data && data.is_active !== false) {
      const profile: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        company_id: data.company_id,
      };
      saveCachedProfile(profile);
      return profile;
    }
    lastError = error;
    if (data?.is_active === false) break; // 明示的にinactiveなら即フォールバック
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }

  // リトライ全失敗時はキャッシュを優先（直前のセッションのroleを引き継ぐ）
  const cached = loadCachedProfile(authUser.id);
  if (cached) {
    console.warn("fetchProfile failed, using cached profile:", lastError);
    return cached;
  }

  // キャッシュも無い場合のみ viewer フォールバック
  console.warn("fetchProfile failed and no cache, using fallback (viewer):", lastError);
  const email = authUser.email || "";
  return {
    id: authUser.id,
    name: authUser.user_metadata?.name || email.split("@")[0] || "",
    email,
    role: "viewer",
    company_id: "",
  };
}

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  // SSR で取得済みの profile を初期値にする。これがあれば初回レンダリングから
  // 編集ボタンの表示判定が確定するので「一瞬消える」事象が発生しない。
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(initialUser === null);

  // SSRで取得した初期値はキャッシュにも書いておく（クライアント遷移後のフォールバック源）
  useEffect(() => {
    if (initialUser) saveCachedProfile(initialUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    // INITIAL_SESSION の発火タイミングに依らず、マウント直後に getSession() で
    // セッションがあれば即 profile を取得する。これを待たないとレンダリング初回で
    // user=null となり、usePermission が全て false を返して編集ボタン等が消える
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        // まずキャッシュで即埋めてレンダリング初回で編集ボタンが消えないようにする
        const cached = loadCachedProfile(session.user.id);
        if (cached && !cancelled) {
          setUser(cached);
          setIsLoading(false);
        }
        const profile = await fetchProfile(session.user);
        if (!cancelled && profile) {
          // 取得済み role が admin/manager/staff なのに viewer にだけ降格するパターンを防ぐ
          setUser((prev) => {
            if (
              prev &&
              prev.id === profile.id &&
              prev.role !== "viewer" &&
              profile.role === "viewer"
            ) {
              return prev;
            }
            return profile;
          });
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
        if (cancelled || !profile) return;
        setUser((prev) => {
          // 既に高い権限で取れている場合、viewer 降格は無視する（一時的な fetch 失敗対策）
          if (
            prev &&
            prev.id === profile.id &&
            prev.role !== "viewer" &&
            profile.role === "viewer"
          ) {
            return prev;
          }
          return profile;
        });
        setIsLoading(false);
      } else if (event === "INITIAL_SESSION" && !session) {
        if (!cancelled) setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        if (!cancelled) {
          setUser(null);
          if (typeof window !== "undefined") {
            try {
              window.localStorage.removeItem(PROFILE_CACHE_KEY);
            } catch {
              // 無視
            }
          }
        }
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
