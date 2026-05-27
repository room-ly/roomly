import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // Server Component からの setAll は無視（Middleware が処理する）
          }
        },
      },
    }
  );
}

export async function getCurrentUserRole(): Promise<{ user_id: string; role: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  return { user_id: user.id, role: data?.role ?? "viewer" };
}

export async function getCompanyId(): Promise<string> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("セッションがありません");

  // JWTペイロードからcustom_access_token_hookが注入したcompany_idを取得
  const payload = JSON.parse(
    Buffer.from(session.access_token.split(".")[1], "base64url").toString()
  );
  const companyId = payload.company_id;
  if (!companyId) {
    // custom_access_token_hook が未設定の場合にここに到達する
    // フォールバックは設けない（user_metadata は自己書き換え可能なため認可に使用不可）
    throw new Error("company_id がJWTに存在しません。Supabase Dashboard で custom_access_token_hook を有効化してください");
  }
  return companyId;
}
