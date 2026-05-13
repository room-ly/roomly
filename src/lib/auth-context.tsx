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
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({}),
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
    return {
      id: authUser.id,
      name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "",
      email: authUser.email || "",
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user);
        setUser(profile);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await fetchProfile(session.user);
        setUser(profile);
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
  ): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: error.message };
    }
    return {};
  };

  const logout = async () => {
    setUser(null);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
