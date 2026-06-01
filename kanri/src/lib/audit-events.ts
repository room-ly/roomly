// 監査ログ（更新履歴）の再fetch をグローバルにトリガーするための小さなイベントバス。
// 各種フォームの保存成功時や削除成功時にこの関数を呼ぶと、
// 表示中の AuditLogSection が再fetch する。

const EVENT_NAME = "roomly:audit-log-refresh";

export function dispatchAuditLogRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function subscribeAuditLogRefresh(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

// サイドバーのバッジカウントを再取得させるイベント。
// 入金・対応案件更新・契約変更など、バッジ数に影響する操作の保存成功時に呼ぶ。
const BADGE_EVENT_NAME = "roomly:badge-refresh";

export function dispatchBadgeRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BADGE_EVENT_NAME));
}

export function subscribeBadgeRefresh(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(BADGE_EVENT_NAME, handler);
  return () => window.removeEventListener(BADGE_EVENT_NAME, handler);
}
