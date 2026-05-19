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
    // フォールバック: user_metadataから取得
    const { data: { user } } = await supabase.auth.getUser();
    const fallback = user?.user_metadata?.company_id;
    if (!fallback) throw new Error("company_id が取得できません");
    return fallback;
  }
  return companyId;
}
