// ローン入力の正規化（API Route 間で共有）

export const LOAN_FIELDS = [
  "owner_id", "name", "lender_name", "loan_number",
  "principal_amount", "interest_rate", "interest_type", "repayment_method",
  "term_months", "disbursement_date", "first_payment_date", "final_payment_date",
  "payment_day", "bank_account_label", "status", "notes",
] as const;

const NULLABLE_KEYS = [
  "owner_id", "loan_number", "interest_rate", "term_months",
  "disbursement_date", "first_payment_date", "final_payment_date",
  "payment_day", "bank_account_label", "notes",
];

const NUMERIC_KEYS = ["principal_amount", "interest_rate", "term_months", "payment_day"];

export function normalizeLoanInput(body: Record<string, any>): Record<string, any> {
  const input: Record<string, any> = {};
  for (const key of LOAN_FIELDS) {
    if (key in body) input[key] = body[key];
  }
  // 空文字・undefined は null に倒す（任意項目）
  for (const k of NULLABLE_KEYS) {
    if (input[k] === "" || input[k] === undefined) input[k] = null;
  }
  // 数値化
  for (const k of NUMERIC_KEYS) {
    if (input[k] !== null && input[k] !== undefined) input[k] = Number(input[k]);
  }
  return input;
}
