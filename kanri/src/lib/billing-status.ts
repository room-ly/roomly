// 家賃請求のステータス派生ロジック（Single Source of Truth）
// DBに保存するステータスは unpaid / partial / paid の3種類のみ。
// 「滞納（overdue）」は due_date と支払い実額から動的に派生させる。

export type DerivedBillingStatus = "paid" | "partial" | "unpaid" | "overdue";

export interface BillingLike {
  total_amount?: number | string | null;
  due_date?: string | null;
  status?: string | null;
  rent_payments?: { amount: number | string }[] | null;
  [key: string]: unknown;
}

export function sumPayments(b: BillingLike): number {
  return (b.rent_payments ?? []).reduce(
    (s, p) => s + Number(p?.amount || 0),
    0
  );
}

export function deriveBillingStatus(
  b: BillingLike,
  today: string = new Date().toISOString().slice(0, 10)
): DerivedBillingStatus {
  const total = Number(b.total_amount) || 0;
  const paid = sumPayments(b);
  if (total > 0 && paid >= total) return "paid";
  if (paid > 0) return "partial";
  if (b.due_date && b.due_date < today) return "overdue";
  return "unpaid";
}

export function isOverdue(
  b: BillingLike,
  today: string = new Date().toISOString().slice(0, 10)
): boolean {
  return deriveBillingStatus(b, today) === "overdue";
}

export function remainingAmount(b: BillingLike): number {
  return Math.max(0, Number(b.total_amount) - sumPayments(b));
}
