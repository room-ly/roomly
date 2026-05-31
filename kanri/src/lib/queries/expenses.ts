import { createClient, type Row } from "./_shared";

// 経費一覧（物件・部屋・オーナー付き）— ページネーション対応
export async function getExpenses(page = 1, pageSize = 50, sort = "expense_date:desc"): Promise<{ data: Row[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const [sortCol, sortDir] = sort.split(":") as [string, string];
  const { data, error, count } = await supabase
    .from("expenses")
    .select(
      "*, property:properties(name), unit:units(unit_number), owner:owners(name)",
      { count: "exact" }
    )
    .order(sortCol, { ascending: sortDir === "asc" })
    .range(from, to);
  if (error) throw error;
  return { data: (data ?? []) as Row[], total: count ?? 0 };
}

// 経費詳細（按分明細・修繕・契約・敷金トランザクション付き）
export async function getExpenseDetail(id: string) {
  const supabase = await createClient();
  const { data: expense, error } = await supabase
    .from("expenses")
    .select(
      [
        "*",
        "property:properties(id, name, address, default_allocation_method, approver_user_id, approver:users!properties_approver_user_id_fkey(id, name))",
        "unit:units(unit_number)",
        "owner:owners(id, name)",
        "payee:payees(id, name)",
        "approver:users!expenses_approved_by_fkey(id, name)",
        "submitter:users!expenses_submitted_by_fkey(id, name)",
        "case:cases(id, title, status)",
        "contract:contracts(id, deposit, deposit_unit, rent, tenant:tenants(id, name))",
        "allocations:expense_allocations(*, unit:units(unit_number), owner:owners(name))",
      ].join(", "),
    )
    .eq("id", id)
    .single();
  if (error || !expense) return null;

  let depositTxs: Row[] = [];
  const contractId = (expense as Row).contract?.id;
  if (contractId) {
    const { data } = await supabase
      .from("deposit_transactions")
      .select("*")
      .eq("contract_id", contractId)
      .order("occurred_at", { ascending: false });
    depositTxs = (data ?? []) as Row[];
  }

  // 承認者の解決: 物件指名 → 会社デフォルト
  const expenseRow = expense as Row;
  const propertyApproverId = expenseRow.property?.approver_user_id ?? null;
  const propertyApprover = expenseRow.property?.approver ?? null;
  let effectiveApprover: { id: string; name: string } | null = propertyApprover;
  if (!effectiveApprover && expenseRow.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("default_approver_user_id, default_approver:users!companies_default_approver_user_id_fkey(id, name)")
      .eq("id", expenseRow.company_id)
      .single();
    if (company?.default_approver_user_id) {
      effectiveApprover = (company as Row).default_approver ?? null;
    }
  }

  return {
    ...expenseRow,
    deposit_transactions: depositTxs,
    effective_approver: effectiveApprover,
    approver_source: propertyApproverId ? "property" : effectiveApprover ? "company" : null,
  } as Row;
}

// 承認待ち経費一覧
export async function getExpensesPendingApproval() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "*, property:properties(name), unit:units(unit_number), owner:owners(name), submitter:users!expenses_submitted_by_fkey(name)",
    )
    .eq("status", "pending_approval")
    .order("submitted_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Row[];
}
