// 監査ログの user_id に記録するシステム実行用の固定UUID。
// cron や system 起点で操作者が存在しない処理で createAdminClient に渡す。
// audit-logs API はこのIDを users テーブルにJOINせず「システム」として返す。
export const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

export const SYSTEM_USER_DISPLAY = {
  name: "システム",
  email: "",
} as const;

export function isSystemUserId(id: string | null | undefined): boolean {
  return id === SYSTEM_USER_ID;
}
