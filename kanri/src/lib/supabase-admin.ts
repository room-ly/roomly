import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * service_role キーを使う管理者クライアント。
 * RLSをバイパスして全社横断のデータにアクセスできる。
 * Cronジョブやユーザー作成など、サーバー側の信頼された処理でのみ使用すること。
 * 絶対にクライアントサイドに渡さない。
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
