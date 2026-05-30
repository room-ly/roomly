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
