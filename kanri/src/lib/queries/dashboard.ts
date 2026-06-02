import { createClient, type Row } from "./_shared";

// ダッシュボード用データ
export async function getDashboardData() {
  const supabase = await createClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  // 満了間近とみなす日数は会社設定（contract_alert_days）に従う。未設定なら90日。
  const { data: companyRow } = await supabase
    .from("companies")
    .select("contract_alert_days")
    .single();
  const alertDays = companyRow?.contract_alert_days ?? 90;
  const inAlertDays = new Date(now.getTime() + alertDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const staleDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const [
    propCount,
    unitTotal,
    unitOccupied,
    unitVacant,
    overdueBillingsRes,
    activeCasesRes,
    alertCasesRes,
    expiringRes,
    pendingMoveOutRes,
    pipelineUnitsRes,
    billingSummaryRes,
    monthlyExpensesRes,
    pendingRemittancesRes,
  ] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("units").select("id", { count: "exact", head: true }),
    supabase.from("units").select("id", { count: "exact", head: true }).eq("status", "occupied"),
    supabase.from("units").select("id", { count: "exact", head: true }).eq("status", "vacant"),
    supabase
      .from("rent_billings")
      .select("id, billing_month, total_amount, due_date, status, contract:contracts(id, tenant:tenants(name)), rent_payments(amount)")
      .lt("due_date", today)
      .neq("status", "exempt")
      .order("billing_month", { ascending: false }),
    supabase
      .from("cases")
      .select("id, title, priority, status, reported_date, category, property:properties(name)")
      .in("status", ["open", "in_progress"])
      .order("reported_date", { ascending: false }),
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"])
      .or("priority.in.(high,urgent),created_at.lt." + staleDate),
    supabase
      .from("contracts")
      .select("id, end_date, contract_type, renewal_effective_date, renewal_rent, tenant:tenants(name), unit:units(unit_number, property_id, property:properties(name)), move_out_requests(id, status, desired_move_out_date)")
      .eq("status", "active")
      .gte("end_date", today)
      .lte("end_date", inAlertDays),
    supabase
      .from("contracts")
      .select("id, tenant:tenants(name), unit:units(unit_number, property:properties(name)), move_out_requests!inner(id, status, desired_move_out_date)")
      .eq("status", "active")
      .in("move_out_requests.status", ["pending", "approved"]),
    supabase
      .from("units")
      .select("id, unit_number, status, rent, property_id, property:properties(name)")
      .in("status", ["maintenance", "vacant"]),
    supabase
      .from("rent_billings")
      .select("total_amount, status, billing_month, rent_payments(amount)")
      .neq("status", "exempt")
      .gte("billing_month", `${now.toISOString().slice(0, 7)}-01`)
      .lt("billing_month", `${new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)}`),
    supabase
      .from("expenses")
      .select("amount")
      .gte("expense_date", `${now.toISOString().slice(0, 7)}-01`)
      .lte("expense_date", `${new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)}`),
    supabase
      .from("owner_remittances")
      .select("id, status")
      .in("status", ["draft", "confirmed"]),
  ]);

  // due_date 超過のうち、rent_payments 合計が total_amount に満たないものを滞納とみなす
  const overdueBillings = ((overdueBillingsRes.data ?? []) as Row[]).filter((b: Row) => {
    const paid = (b.rent_payments ?? []).reduce(
      (s: number, p: { amount: number }) => s + Number(p.amount || 0),
      0
    );
    return paid < Number(b.total_amount);
  });
  const activeCases = (activeCasesRes.data ?? []) as Row[];
  const expiringContracts = (expiringRes.data ?? []) as Row[];
  const pendingMoveOuts = (pendingMoveOutRes.data ?? []) as Row[];
  const allPipelineUnits = (pipelineUnitsRes.data ?? []) as Row[];
  const allBillings = (billingSummaryRes.data ?? []) as Row[];
  const monthlyExpenses = (monthlyExpensesRes.data ?? []) as Row[];
  const pendingRemittances = (pendingRemittancesRes.data ?? []) as Row[];

  const totalUnits = unitTotal.count ?? 0;
  const occupiedUnits = unitOccupied.count ?? 0;
  const vacantUnitsCount = unitVacant.count ?? 0;
  const overdueAmount = overdueBillings.reduce((s: number, b: Row) => {
    const paid = (b.rent_payments ?? []).reduce(
      (sum: number, p: { amount: number }) => sum + Number(p.amount || 0),
      0
    );
    return s + (Number(b.total_amount) - paid);
  }, 0);
  // 家賃ページと同じ定義: rent_payments 実額ベース
  const totalExpected = allBillings.reduce((s: number, b: Row) => s + Number(b.total_amount), 0);
  const totalReceived = allBillings.reduce((s: number, b: Row) => {
    const paid = (b.rent_payments ?? []).reduce(
      (sum: number, p: { amount: number }) => sum + Number(p.amount || 0),
      0
    );
    return s + Math.min(paid, Number(b.total_amount));
  }, 0);
  const monthlyExpenseTotal = monthlyExpenses.reduce((s: number, e: Row) => s + Number(e.amount), 0);

  return {
    stats: {
      total_properties: propCount.count ?? 0,
      total_units: totalUnits,
      occupied_units: occupiedUnits,
      vacant_units: vacantUnitsCount,
      occupancy_rate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 1000) / 10 : 0,
      total_rent_expected: totalExpected,
      total_rent_received: totalReceived,
      // 今月の請求のうち、まだ入金されていない額（期限前含む＝これから入る見込み）
      total_rent_unpaid: Math.max(totalExpected - totalReceived, 0),
      collection_rate: totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 1000) / 10 : 0,
      overdue_count: overdueBillings.length,
      overdue_amount: overdueAmount,
      open_cases: activeCases.length,
      alert_cases: alertCasesRes.count ?? 0,
      expiring_contracts: expiringContracts.length,
      pending_move_outs: pendingMoveOuts.length,
      monthly_expenses: monthlyExpenseTotal,
      pending_remittances: pendingRemittances.length,
      contract_alert_days: alertDays,
    },
    overdueBillings,
    activeCases,
    expiringContracts,
    pendingMoveOuts,
    maintenanceUnits: allPipelineUnits.filter((u: Row) => u.status === "maintenance"),
    vacantUnits: allPipelineUnits.filter((u: Row) => u.status === "vacant"),
  };
}

// 月次推移データ（過去6ヶ月分の入居率・家賃回収率）
export async function getMonthlyTrend() {
  const supabase = await createClient();
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  // 月ごとの家賃請求データ（家賃ページと同じく rent_payments 実額ベース）
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [{ data: billings }, { data: expenses }] = await Promise.all([
    supabase
      .from("rent_billings")
      .select("billing_month, status, total_amount, rent_payments(amount)")
      .neq("status", "exempt")
      .gte("billing_month", sixMonthsAgo.toISOString().slice(0, 10)),
    supabase
      .from("expenses")
      .select("amount, expense_date")
      .gte("expense_date", sixMonthsAgo.toISOString().slice(0, 10)),
  ]);

  const trend = months.map((month) => {
    const monthBillings = (billings ?? []).filter(
      (b: Row) => (b.billing_month as string)?.slice(0, 7) === month
    );
    const total = monthBillings.reduce(
      (s: number, b: Row) => s + Number(b.total_amount),
      0
    );
    const paid = monthBillings.reduce((s: number, b: Row) => {
      const sum = (b.rent_payments ?? []).reduce(
        (acc: number, p: { amount: number }) => acc + Number(p.amount || 0),
        0
      );
      return s + Math.min(sum, Number(b.total_amount));
    }, 0);
    const expenseTotal = (expenses ?? [])
      .filter((e: Row) => (e.expense_date as string)?.slice(0, 7) === month)
      .reduce((s: number, e: Row) => s + Number(e.amount || 0), 0);
    return {
      month,
      label: `${month.slice(5)}月`,
      totalAmount: total,
      paidAmount: paid,
      collectionRate: total > 0 ? Math.round((paid / total) * 100) : 0,
      expenseAmount: expenseTotal,
    };
  });

  return trend;
}
