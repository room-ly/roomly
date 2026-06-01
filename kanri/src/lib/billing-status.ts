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

// 契約の payment_day (1-31) と billing_month (YYYY-MM-01) から
// 当月の支払期日 (YYYY-MM-DD) を計算する。
// 指定日がその月に存在しない場合は月末日に丸める（例: 31日指定の2月 → 2/28）。
export function calcDueDate(billingMonth: string, paymentDay: number | null | undefined): string {
  const [y, m] = billingMonth.slice(0, 7).split("-").map(Number);
  // m は1-indexedなので、UTC指定で当月末日を取る: Date.UTC(y, m, 0) → 当月末
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const target = paymentDay ?? lastDay;
  const day = Math.min(Math.max(1, target), lastDay);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

