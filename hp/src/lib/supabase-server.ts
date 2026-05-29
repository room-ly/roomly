import { createServerClient } from "@supabase/ssr";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.ROOMLY_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.ROOMLY_SUPABASE_ANON_KEY!;

// Cookieセッションを使うSSRクライアント。affiliateの本人セッション読み書きに使う。
export async function createAffiliateServerClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component 経由は無視（middlewareで処理する想定）
        }
      },
    },
  });
}

// service_role クライアント。RLSを越えて affiliates テーブル等にアクセスする用途。
// 必ずAPIルートの中だけで使う(クライアントに漏らさない)。
export function createServiceRoleClient() {
  return createJsClient(
    SUPABASE_URL,
    process.env.ROOMLY_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
