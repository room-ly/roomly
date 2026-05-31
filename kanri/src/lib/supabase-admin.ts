import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * service_role キーを使う管理者クライアント。
 * RLSをバイパスして全社横断のデータにアクセスできる。
 * Cronジョブやユーザー作成など、サーバー側の信頼された処理でのみ使用すること。
 * 絶対にクライアントサイドに渡さない。
 *
 * @param actorId 監査ログに記録する操作者のユーザーID。
 *   ユーザー起点の処理（API Routeで認証済みユーザーの代理書き込み）では必ず指定する。
 *   cron / system 起点で操作者が存在しない場合のみ undefined。
 *   付与すると X-Actor-Id ヘッダーが PostgREST 経由で監査トリガーに渡り、
 *   audit_logs.user_id に記録される。
 */
export function createAdminClient(actorId?: string) {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: actorId
        ? { headers: { "X-Actor-Id": actorId } }
        : undefined,
    }
  );
}
