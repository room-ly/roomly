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

// 指定オーナー・指定月のローン返済額を集計する。
// オーナーレポート（送金明細）に「返済後キャッシュフロー」を出すために使う。
// monthStart は YYYY-MM-01 形式（owner_remittances.remittance_month と同じ）。
export async function getOwnerLoanRepaymentForMonth(ownerId: string, monthStart: string) {
  const supabase = await createClient();

  // 当該オーナーに紐づくローンを取得
  const { data: loans } = await supabase
    .from("loans")
    .select("id, name, lender_name")
    .eq("owner_id", ownerId);
  const loanList = (loans ?? []) as Row[];
  if (loanList.length === 0) {
    return { hasLoan: false, totalPrincipal: 0, totalInterest: 0, totalRepayment: 0, items: [] as Row[] };
  }

  // 月初〜翌月初の範囲で返済予定行を集計
  const start = monthStart; // YYYY-MM-01
  const d = new Date(`${monthStart}T00:00:00Z`);
  const nextMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  const end = nextMonth.toISOString().slice(0, 10);

  const loanIds = loanList.map((l) => l.id);
  const { data: reps } = await supabase
    .from("loan_repayments")
    .select("loan_id, principal_amount, interest_amount, total_amount, payment_date")
    .in("loan_id", loanIds)
    .gte("payment_date", start)
    .lt("payment_date", end);

  const loanById = new Map(loanList.map((l) => [l.id, l]));
  const byLoan = new Map<string, { name: string; lender: string; principal: number; interest: number; total: number }>();
  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalRepayment = 0;

  for (const r of reps ?? []) {
    const principal = Number(r.principal_amount ?? 0);
    const interest = Number(r.interest_amount ?? 0);
    const total = Number(r.total_amount ?? principal + interest);
    totalPrincipal += principal;
    totalInterest += interest;
    totalRepayment += total;

    const meta = loanById.get(r.loan_id);
    const cur = byLoan.get(r.loan_id) ?? {
      name: meta?.name ?? "ローン",
      lender: meta?.lender_name ?? "",
      principal: 0,
      interest: 0,
      total: 0,
    };
    cur.principal += principal;
    cur.interest += interest;
    cur.total += total;
    byLoan.set(r.loan_id, cur);
  }

  return {
    hasLoan: true,
    totalPrincipal,
    totalInterest,
    totalRepayment,
    items: Array.from(byLoan.values()),
  };
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
