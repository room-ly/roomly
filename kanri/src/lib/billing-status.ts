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

// 指定年月における「日」を、その月に収まる形に丸めて YYYY-MM-DD を返す。
// 例: clampDateInMonth(2026, 2, 31) → "2026-02-28"
export function clampDateInMonth(year: number, month1: number, day: number): string {
  const lastDay = new Date(Date.UTC(year, month1, 0)).getUTCDate();
  const d = Math.min(Math.max(1, day), lastDay);
  return `${year}-${String(month1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// 契約の payment_due_day と billing_month から、当月の支払期日 (YYYY-MM-DD) を計算する。
// 後方互換のため payment_month_offset を考慮しないシンプル版。
// 指定日がその月に存在しない場合は月末日に丸める。
export function calcDueDate(billingMonth: string, paymentDay: number | null | undefined): string {
  const [y, m] = billingMonth.slice(0, 7).split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return clampDateInMonth(y, m, paymentDay ?? lastDay);
}

// 締日から支払期日を導出する。
// billingMonth は「締日が属する月」(YYYY-MM-01)。
// 支払月 = 締日月 + paymentMonthOffset、その月の paymentDueDay が支払期日。
export function calcDueDateWithCycle(
  billingMonth: string,
  paymentDueDay: number | null | undefined,
  paymentMonthOffset: number | null | undefined
): string {
  const [y, m] = billingMonth.slice(0, 7).split("-").map(Number);
  const offset = paymentMonthOffset ?? 1;
  // m は1-indexed。月またぎは Date.UTC で正規化させる
  const target = new Date(Date.UTC(y, m - 1 + offset, 1));
  const ty = target.getUTCFullYear();
  const tm = target.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(ty, tm, 0)).getUTCDate();
  return clampDateInMonth(ty, tm, paymentDueDay ?? lastDay);
}

// 「今日が closing_day と一致するか」を判定。
// closing_day がその月に存在しない場合は、その月の月末日と一致した日も真とする。
// 例: closing_day=31 で 2月の場合、2/28（or 2/29）が一致と判定される。
export function isClosingDay(today: Date, closingDay: number | null | undefined): boolean {
  const cd = closingDay ?? 31;
  const y = today.getUTCFullYear();
  const m1 = today.getUTCMonth() + 1;
  const d = today.getUTCDate();
  const lastDay = new Date(Date.UTC(y, m1, 0)).getUTCDate();
  const effective = Math.min(Math.max(1, cd), lastDay);
  return d === effective;
}

// 「締日が closingDay の月の billing_month」を、today を起点に決める。
// 例: today=2026-06-30, closing_day=31 → "2026-06-01"
//     today=2026-06-20, closing_day=20 → "2026-06-01"
export function billingMonthForClosing(today: Date): string {
  const y = today.getUTCFullYear();
  const m1 = today.getUTCMonth() + 1;
  return `${y}-${String(m1).padStart(2, "0")}-01`;
}

