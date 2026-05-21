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

export class DemoLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoLimitError";
  }
}

// デモアカウントの1週間あたり書き込み上限
const DEMO_WEEKLY_WRITE_LIMIT = 100;

/**
 * デモ会社かどうか確認し、上限超過なら例外を投げる。
 * 上限内なら書き込みログを記録して返す。
 * 非デモ会社はそのまま通過。
 */
export async function checkDemoLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  tableName: string,
  action: "create" | "update" | "delete"
): Promise<void> {
  const { data: company } = await supabase
    .from("companies")
    .select("is_demo")
    .eq("id", companyId)
    .single();

  if (!company?.is_demo) return;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 直近の日曜
  weekStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("demo_write_logs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("created_at", weekStart.toISOString());

  if ((count ?? 0) >= DEMO_WEEKLY_WRITE_LIMIT) {
    throw new DemoLimitError(`デモアカウントは1週間に${DEMO_WEEKLY_WRITE_LIMIT}回まで操作できます。毎週月曜0時にリセットされます。`);
  }

  await supabase.from("demo_write_logs").insert({
    company_id: companyId,
    action,
    table_name: tableName,
  });
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
