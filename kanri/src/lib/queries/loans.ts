import { createClient, activeContractFees, type Row } from "./_shared";

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

// ローンのキャッシュフロー分析。
// このローンが紐づく物件の家賃収入（入居中区画の家賃合計）と、当月の返済額を比較し、
// 「家賃収入 − 返済 = 手残り」を出す。自社所有物件・個人大家の収支把握に使う。
// 受託管理（他人の物件・他人のローン）の文脈では使わない＝送金明細には出さない。
export async function getLoanCashflow(loanId: string, monthStart: string) {
  const supabase = await createClient();

  // このローンに紐づく物件IDを取得
  const { data: linkRows } = await supabase
    .from("loan_properties")
    .select("property_id, allocation_ratio")
    .eq("loan_id", loanId);
  const links = (linkRows ?? []) as Row[];
  const propertyIds = links.map((l) => l.property_id).filter(Boolean);

  // 物件の入居中区画の家賃合計（＝月額家賃収入の概算）
  let monthlyRentIncome = 0;
  if (propertyIds.length > 0) {
    const { data: units } = await supabase
      .from("units")
      .select("rent, management_fee, status, property_id, contracts(rent, management_fee, status, voided_at)")
      .in("property_id", propertyIds)
      .eq("status", "occupied");
    // 入居中の家賃は契約が正。アクティブ契約の rent を使う
    for (const u of units ?? []) {
      monthlyRentIncome += activeContractFees(u).rent;
    }
  }

  // 当月の返済額（月初〜翌月初）
  const start = monthStart; // YYYY-MM-01
  const d = new Date(`${monthStart}T00:00:00Z`);
  const nextMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  const end = nextMonth.toISOString().slice(0, 10);

  const { data: reps } = await supabase
    .from("loan_repayments")
    .select("principal_amount, interest_amount, total_amount, payment_date")
    .eq("loan_id", loanId)
    .gte("payment_date", start)
    .lt("payment_date", end);

  let principal = 0;
  let interest = 0;
  let repayment = 0;
  for (const r of reps ?? []) {
    const p = Number(r.principal_amount ?? 0);
    const i = Number(r.interest_amount ?? 0);
    principal += p;
    interest += i;
    repayment += Number(r.total_amount ?? p + i);
  }

  return {
    monthStart,
    propertyCount: propertyIds.length,
    monthlyRentIncome,
    principal,
    interest,
    repayment,
    cashflow: monthlyRentIncome - repayment,
    hasRepayment: (reps ?? []).length > 0,
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
