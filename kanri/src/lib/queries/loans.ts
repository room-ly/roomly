import { createClient, type Row } from "./_shared";

// ローン一覧（紐付け物件・オーナー付き）
export async function getLoans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loans")
    .select(
      "*, owner:owners(id, name), loan_properties(id, allocation_ratio, property:properties(id, name))",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Row[];
}

// ローン詳細（返済予定表付き）
export async function getLoanDetail(id: string) {
  const supabase = await createClient();
  const [{ data: loan, error }, { data: repayments }] = await Promise.all([
    supabase
      .from("loans")
      .select(
        "*, owner:owners(id, name), loan_properties(id, allocation_ratio, property:properties(id, name))",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("loan_repayments")
      .select("*")
      .eq("loan_id", id)
      .order("payment_date", { ascending: true }),
  ]);
  if (error || !loan) return null;
  return { loan, repayments: (repayments ?? []) as Row[] };
}

// ローンサマリー（一覧画面ヘッダー用の集計）
// 残高は各ローンの「最後の返済予定行の balance_after」または借入元本で代替
export async function getLoanSummary() {
  const supabase = await createClient();
  const { data: loans } = await supabase
    .from("loans")
    .select("id, principal_amount, status");
  const activeLoans = (loans ?? []).filter((l: Row) => l.status === "active");

  const ids = activeLoans.map((l: Row) => l.id);
  let outstanding = 0;
  if (ids.length > 0) {
    // 各ローンの最新（未来含む直近）返済後残高を集計
    const { data: reps } = await supabase
      .from("loan_repayments")
      .select("loan_id, payment_date, balance_after")
      .in("loan_id", ids)
      .order("payment_date", { ascending: false });
    const seen = new Set<string>();
    const balanceByLoan = new Map<string, number>();
    for (const r of reps ?? []) {
      if (seen.has(r.loan_id)) continue;
      seen.add(r.loan_id);
      balanceByLoan.set(r.loan_id, Number(r.balance_after ?? 0));
    }
    for (const l of activeLoans) {
      // 返済予定表が無いローンは借入元本を残高とみなす
      outstanding += balanceByLoan.has(l.id)
        ? (balanceByLoan.get(l.id) ?? 0)
        : Number(l.principal_amount ?? 0);
    }
  }

  return {
    activeCount: activeLoans.length,
    totalPrincipal: activeLoans.reduce((s: number, l: Row) => s + Number(l.principal_amount ?? 0), 0),
    outstanding,
  };
}
