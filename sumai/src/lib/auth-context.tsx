"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface TenantUser {
  id: string;
  name: string;
  email: string;
  tenant_id: string;
  company_id: string;
}

interface AuthContextType {
  user: TenantUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
});

const supabase = createClient();

async function fetchTenantProfile(authUser: SupabaseUser): Promise<TenantUser | null> {
  const { data: mapping } = await supabase
    .from("tenant_auth_users")
    .select("tenant_id, company_id")
    .eq("auth_user_id", authUser.id)
    .single();

  if (!mapping) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, email")
    .eq("id", mapping.tenant_id)
    .single();

  return {
    id: authUser.id,
    name: tenant?.name ?? authUser.email?.split("@")[0] ?? "",
    email: tenant?.email ?? authUser.email ?? "",
    tenant_id: mapping.tenant_id,
    company_id: mapping.company_id,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TenantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user
      ) {
        const profile = await fetchTenantProfile(session.user);
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

  const logout = async () => {
    setUser(null);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
