import { createClient, type Row } from "./_shared";

// 契約一覧（入居者・部屋・物件・退去申請付き）— ページネーション対応
export async function getContracts(page = 1, pageSize = 50, sort = "start_date:desc"): Promise<{ data: Row[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const [sortCol, sortDir] = sort.split(":") as [string, string];
  const { data, error, count } = await supabase
    .from("contracts")
    .select(
      "*, tenant:tenants(name), unit:units(id, unit_number, property_id, property:properties(id, name)), move_out_requests(id, status, desired_move_out_date)",
      { count: "exact" }
    )
    .order(sortCol, { ascending: sortDir === "asc" })
    .range(from, to);
  if (error) throw error;

  const rows = (data ?? []).map((c: Row) => {
    const reqs = (c.move_out_requests ?? []) as Row[];
    const pending = reqs.find((r: Row) => r.status === "pending");
    const approved = reqs.find((r: Row) => r.status === "approved");
    return {
      ...c,
      _move_out_status: pending ? "pending" : approved ? "approved" : null,
      _move_out_date: pending?.desired_move_out_date ?? approved?.desired_move_out_date ?? null,
    };
  }) as Row[];
  return { data: rows, total: count ?? 0 };
}

// 契約詳細（入居者・部屋・物件・家賃請求履歴付き）
export async function getContractDetail(id: string) {
  const supabase = await createClient();
  const [{ data: contract, error }, { data: billings }, { data: moveOutRequests }, { data: depositTxs }] = await Promise.all([
    supabase
      .from("contracts")
      .select("*, tenant:tenants(id, name, name_kana, phone, email, workplace), unit:units(id, unit_number, area_sqm, layout, property:properties(id, name, address))")
      .eq("id", id)
      .single(),
    supabase
      .from("rent_billings")
      .select("id, billing_month, total_amount, status")
      .eq("contract_id", id)
      .order("billing_month", { ascending: false })
      .limit(12),
    supabase
      .from("move_out_requests")
      .select("*")
      .eq("contract_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("deposit_transactions")
      .select("*, expense:expenses(id, description), billing:rent_billings(id, billing_month)")
      .eq("contract_id", id)
      .order("occurred_at", { ascending: false }),
  ]);
  if (error || !contract) return null;

  let unitContracts: Row[] = [];
  if (contract.unit_id) {
    const { data } = await supabase
      .from("contracts")
      .select("id, start_date, end_date, rent, status, contract_type, tenant:tenants(id, name)")
      .eq("unit_id", contract.unit_id)
      .neq("id", id)
      .order("start_date", { ascending: false });
    unitContracts = data ?? [];
  }

  return {
    contract,
    billings: billings ?? [],
    moveOutRequests: moveOutRequests ?? [],
    unitContracts,
    depositTransactions: (depositTxs ?? []) as Row[],
  };
}

// 契約セレクタ用（アクティブな契約のみ）
export async function getContractsForSelect(unitId?: string | null) {
  const supabase = await createClient();
  let q = supabase
    .from("contracts")
    .select("id, unit_id, deposit, deposit_unit, rent, status, tenant:tenants(name), unit:units(unit_number, property:properties(name))")
    .eq("status", "active")
    .order("start_date", { ascending: false });
  if (unitId) q = q.eq("unit_id", unitId);
  const { data } = await q;
  return (data ?? []) as Row[];
}
