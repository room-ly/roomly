"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
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

// Supabase Auth ユーザーから public.users の情報を取得
async function fetchProfile(authUser: SupabaseUser): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, company_id, is_active")
    .eq("id", authUser.id)
    .single();

  if (error || !data || data.is_active === false) {
    // RLSブロック等でprofileが取れない場合、auth userからフォールバック
    const email = authUser.email || "";
    return {
      id: authUser.id,
      name: authUser.user_metadata?.name || email.split("@")[0] || "",
      email,
      role: "staff",
      company_id: "",
    };
  }
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    company_id: data.company_id,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user
      ) {
        const profile = await fetchProfile(session.user);
        setUser(profile);
        setIsLoading(false);
      } else if (event === "INITIAL_SESSION" && !session) {
        setIsLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 失敗を記録
      await fetch("/api/auth/login-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "record", success: false }),
      });
      return { error: error.message };
    }

    // 成功を記録（失敗履歴をクリア）
    await fetch("/api/auth/login-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "record", success: true }),
    });

    // MFA要否チェック
    const { data: mfaData } = await supabase.auth.mfa.listFactors();
    const totpFactors = mfaData?.totp ?? (mfaData as any)?.all?.filter((f: any) => f.factor_type === "totp") ?? [];
    if (totpFactors.length > 0) {
      return { mfaRequired: true };
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
