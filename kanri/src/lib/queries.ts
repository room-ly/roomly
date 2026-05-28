import { createClient } from "@/lib/supabase-server";
import type { Database } from "./database.types";

export type Tables = Database["public"]["Tables"];
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

// 課金状態を取得し、表示可能な区画IDセットを返す
// 課金中 → null（制限なし）、課金切れで11区画以上 → 古い順10件のIDセット
async function getVisibleUnitIds(): Promise<Set<string> | null> {
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("subscription_status, subscription_current_period_end, max_units")
    .single();

  const isActive =
    company?.subscription_status === "active" &&
    (!company.subscription_current_period_end ||
      new Date(company.subscription_current_period_end) > new Date());

  if (isActive) return null; // 制限なし

  // フリープラン上限（デフォルト10）
  const freeLimit = 10;

  const { data: allUnits } = await supabase
    .from("units")
    .select("id")
    .order("created_at", { ascending: true });

  const units = allUnits ?? [];
  if (units.length <= freeLimit) return null; // 制限不要

  // 古い順にfreeLimit件だけ表示
  const visibleIds = new Set(units.slice(0, freeLimit).map((u: Row) => u.id as string));
  return visibleIds;
}

// 区画リストにvisibility情報を付与
function applyUnitVisibility(units: Row[], visibleIds: Set<string> | null): Row[] {
  if (!visibleIds) return units.map((u: Row) => ({ ...u, _hidden: false }));
  return units.map((u: Row) => ({
    ...u,
    _hidden: !visibleIds.has(u.id),
  }));
}

// 物件一覧（オーナー名・部屋情報・代表画像付き）
export async function getProperties() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, owner:owners(id, name), units(id, status, rent)")
    .order("name");
  if (error) throw error;

  const properties = (data ?? []) as Row[];
  if (properties.length === 0) return properties;

  const propertyIds = properties.map((p: Row) => p.id);
  const { data: images } = await supabase
    .from("documents")
    .select("property_id, file_path, is_primary")
    .in("property_id", propertyIds)
    .is("unit_id", null)
    .eq("document_type", "photo")
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  const thumbnailMap = new Map<string, string>();
  for (const img of images ?? []) {
    if (!img.property_id) continue;
    if (img.is_primary || !thumbnailMap.has(img.property_id)) {
      thumbnailMap.set(
        img.property_id,
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${img.file_path}`
      );
    }
  }

  return properties.map((p: Row) => ({
    ...p,
    thumbnail_url: thumbnailMap.get(p.id) ?? null,
  }));
}

// 物件詳細（部屋一覧 + アクティブ契約付き）
export async function getPropertyDetail(id: string) {
  const supabase = await createClient();

  const [{ data: property, error }, { data: units }, visibleIds] = await Promise.all([
    supabase.from("properties").select("*, owner:owners(id, name)").eq("id", id).single(),
    supabase.from("units").select("*").eq("property_id", id).order("unit_number"),
    getVisibleUnitIds(),
  ]);
  if (error || !property) return null;

  const unitIds = (units ?? []).map((u: Row) => u.id);
  let contracts: Row[] = [];
  if (unitIds.length > 0) {
    const { data } = await supabase
      .from("contracts")
      .select("id, unit_id, tenant:tenants(name)")
      .eq("status", "active")
      .in("unit_id", unitIds);
    contracts = data ?? [];
  }

  const visibleUnits = applyUnitVisibility(units ?? [], visibleIds);

  return { property, units: visibleUnits, contracts };
}

// 部屋詳細（物件・アクティブ契約・入居者付き）
export async function getUnitDetail(unitId: string) {
  const supabase = await createClient();

  const [{ data: unit, error }, { data: contracts }, { data: cases }] = await Promise.all([
    supabase.from("units").select("*, property:properties(id, name, address, property_type)").eq("id", unitId).single(),
    supabase.from("contracts").select("*, tenant:tenants(id, name, phone, email)").eq("unit_id", unitId).order("start_date", { ascending: false }),
    supabase.from("cases").select("*").eq("unit_id", unitId).order("reported_date", { ascending: false }).limit(5),
  ]);
  if (error || !unit) return null;

  return {
    unit,
    contracts: contracts ?? [],
    cases: cases ?? [],
  };
}

// 入居者一覧（アクティブ契約・部屋・物件情報付き）
export async function getTenantsWithInfo() {
  const supabase = await createClient();

  const [tenantsRes, contractsRes] = await Promise.all([
    supabase.from("tenants").select("*").order("name"),
    supabase
      .from("contracts")
      .select(
        "id, tenant_id, unit_id, rent, status, unit:units(unit_number, property:properties(name))"
      )
      .eq("status", "active"),
  ]);

  const tenants = (tenantsRes.data ?? []) as Row[];
  const contracts = (contractsRes.data ?? []) as Row[];

  return tenants.map((t: Row) => {
    const contract = contracts.find((c: Row) => c.tenant_id === t.id);
    return { ...t, contract: contract ?? null };
  });
}

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

// 入居者詳細（契約・物件・家賃請求付き）
export async function getTenantDetail(id: string) {
  const supabase = await createClient();
  const [{ data: tenant, error }, { data: contracts }] = await Promise.all([
    supabase.from("tenants").select("*").eq("id", id).single(),
    supabase.from("contracts").select("*, unit:units(unit_number, property:properties(id, name))").eq("tenant_id", id).order("start_date", { ascending: false }),
  ]);
  if (error || !tenant) return null;

  return { tenant, contracts: contracts ?? [] };
}

// 対応案件詳細（物件・部屋・対応履歴付き）
export async function getCaseDetail(id: string) {
  const supabase = await createClient();
  const [{ data: caseRow, error }, { data: logs }] = await Promise.all([
    supabase.from("cases").select("*, property:properties(id, name, address, owner:owners(id, name, email)), unit:units(unit_number), tenant:tenants(id, name, phone, email)").eq("id", id).single(),
    supabase.from("case_logs").select("*").eq("case_id", id).order("logged_at", { ascending: false }),
  ]);
  if (error || !caseRow) return null;

  return { case: caseRow, logs: logs ?? [] };
}

// オーナー詳細（物件・送金履歴付き）
export async function getOwnerDetail(id: string) {
  const supabase = await createClient();
  const [{ data: owner, error }, { data: remittances }] = await Promise.all([
    supabase.from("owners").select("*, properties(id, name, management_fee_type, management_fee_rate, management_fee_amount, management_form, units(id, status, rent))").eq("id", id).single(),
    supabase.from("owner_remittances").select("id, remittance_month, total_rent, management_fee_deducted, expense_deducted, net_amount, status").eq("owner_id", id).order("remittance_month", { ascending: false }).limit(12),
  ]);
  if (error || !owner) return null;

  return { owner, remittances: remittances ?? [] };
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
        "contract:contracts(id, deposit, tenant:tenants(id, name))",
        "allocations:expense_allocations(*, unit:units(unit_number), owner:owners(name))",
      ].join(", "),
    )
    .eq("id", id)
    .single();
  if (error || !expense) return null;

  // 紐付く契約の敷金トランザクションをまとめて取得
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

// 対応案件セレクタ用
export async function getCasesForSelect(propertyId?: string | null) {
  const supabase = await createClient();
  let q = supabase
    .from("cases")
    .select("id, title, status, property_id, unit_id, property:properties(name), unit:units(unit_number)")
    .order("reported_date", { ascending: false })
    .limit(50);
  if (propertyId) q = q.eq("property_id", propertyId);
  const { data } = await q;
  return (data ?? []) as Row[];
}

// 契約セレクタ用（アクティブな契約のみ）
export async function getContractsForSelect(unitId?: string | null) {
  const supabase = await createClient();
  let q = supabase
    .from("contracts")
    .select("id, unit_id, deposit, status, tenant:tenants(name), unit:units(unit_number, property:properties(name))")
    .eq("status", "active")
    .order("start_date", { ascending: false });
  if (unitId) q = q.eq("unit_id", unitId);
  const { data } = await q;
  return (data ?? []) as Row[];
}

// 敷金サマリ（残高計算用のトランザクション取得）
export async function getDepositTransactions(contractId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deposit_transactions")
    .select("*, expense:expenses(id, description), billing:rent_billings(id, billing_month)")
    .eq("contract_id", contractId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Row[];
}

// 送金詳細（オーナー・明細付き）
export async function getRemittanceDetail(id: string) {
  const supabase = await createClient();
  const [{ data: remittance, error }, { data: items }] = await Promise.all([
    supabase.from("owner_remittances").select("*, owner:owners(id, name, phone, email, bank_name, bank_branch, bank_account_type, bank_account_holder)").eq("id", id).single(),
    supabase.from("owner_remittance_items").select("*, property:properties(name), unit:units(unit_number)").eq("remittance_id", id).order("created_at"),
  ]);
  if (error || !remittance) return null;

  return { remittance, items: items ?? [] };
}

// 滞納エイジングレポート（30/60/90+日の滞納額・件数 + 内訳）
// 「滞納」= due_date を過ぎていて、入金合計が請求額に達していない請求。
// status カラムには依存しない（自動更新ジョブが無い前提でも常に正しく出るように）。
export interface AgingItem {
  id: string;
  due_date: string;
  days_overdue: number;
  unpaid_amount: number;
  total_amount: number;
  tenant_name: string | null;
  property_name: string | null;
  unit_number: string | null;
}
export interface AgingBucket {
  count: number;
  amount: number;
  items: AgingItem[];
}
export async function getOverdueAging(): Promise<{
  bucket30: AgingBucket;
  bucket60: AgingBucket;
  bucket90: AgingBucket;
}> {
  const supabase = await createClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // due_date を過ぎた請求を、入金額算出のため rent_payments も join して取得
  const { data } = await supabase
    .from("rent_billings")
    .select(
      "id, due_date, total_amount, contract:contracts(tenant:tenants(name), unit:units(unit_number, property:properties(name))), rent_payments(amount)"
    )
    .lt("due_date", todayStr);

  const result: { bucket30: AgingBucket; bucket60: AgingBucket; bucket90: AgingBucket } = {
    bucket30: { count: 0, amount: 0, items: [] },
    bucket60: { count: 0, amount: 0, items: [] },
    bucket90: { count: 0, amount: 0, items: [] },
  };
  for (const row of (data ?? []) as any[]) {
    const total = Number(row.total_amount) || 0;
    const paid = (row.rent_payments ?? []).reduce(
      (s: number, p: any) => s + (Number(p.amount) || 0),
      0
    );
    const unpaid = total - paid;
    if (unpaid <= 0) continue;

    const due = new Date(row.due_date);
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const item: AgingItem = {
      id: row.id,
      due_date: row.due_date,
      days_overdue: daysOverdue,
      unpaid_amount: unpaid,
      total_amount: total,
      tenant_name: row.contract?.tenant?.name ?? null,
      property_name: row.contract?.unit?.property?.name ?? null,
      unit_number: row.contract?.unit?.unit_number ?? null,
    };

    // daysOverdue で振り分け（〜30日 / 31〜60日 / 61日〜）
    let bucket: AgingBucket;
    if (daysOverdue > 60) bucket = result.bucket90;
    else if (daysOverdue > 30) bucket = result.bucket60;
    else bucket = result.bucket30;
    bucket.count++;
    bucket.amount += unpaid;
    bucket.items.push(item);
  }
  // 各バケット内は古い順（滞納日数大きい順）に
  for (const b of [result.bucket30, result.bucket60, result.bucket90]) {
    b.items.sort((a, b) => b.days_overdue - a.days_overdue);
  }
  return result;
}

// 家賃請求一覧（契約・入居者・物件付き）— ページネーション対応
export async function getRentBillings(
  page = 1,
  pageSize = 50,
  sort = "billing_month:desc",
  billingMonth?: string,
): Promise<{ data: Row[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const [sortCol, sortDir] = sort.split(":") as [string, string];
  let query = supabase
    .from("rent_billings")
    .select(
      "*, contract:contracts(id, tenant:tenants(name, phone), unit:units(unit_number, property:properties(id, name))), rent_payments(payment_date, amount)",
      { count: "exact" }
    );
  if (billingMonth) {
    query = query.eq("billing_month", billingMonth);
  }
  const { data, error, count } = await query
    .order(sortCol, { ascending: sortDir === "asc" })
    .range(from, to);
  if (error) throw error;
  return { data: (data ?? []) as Row[], total: count ?? 0 };
}

// 家賃画面の月セレクト用に、rent_billings に存在する全 billing_month を新しい順で返す
export async function getAvailableBillingMonths(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rent_billings")
    .select("billing_month")
    .order("billing_month", { ascending: false });
  if (error) throw error;
  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.billing_month) set.add(row.billing_month as string);
  }
  return Array.from(set);
}

// 家賃請求詳細 — 指定IDの請求を起点に、同一契約の全請求を時系列で返す
export async function getRentBillingDetail(id: string) {
  const supabase = await createClient();
  const { data: target, error: targetErr } = await supabase
    .from("rent_billings")
    .select(
      "*, contract:contracts(id, tenant:tenants(id, name, phone, email), unit:units(unit_number, property:properties(id, name, address))), rent_payments(id, amount, payment_date, payment_method, notes, created_at)"
    )
    .eq("id", id)
    .single();
  if (targetErr || !target) return null;

  const contractId = target.contract?.id;
  if (!contractId) return { current: target, history: [target] };

  const { data: history, error: histErr } = await supabase
    .from("rent_billings")
    .select(
      "id, billing_month, rent, management_fee, other_amount, other_description, total_amount, due_date, status, rent_payments(id, amount, payment_date, payment_method, notes)"
    )
    .eq("contract_id", contractId)
    .order("billing_month", { ascending: false });

  return {
    current: target,
    history: histErr ? [target] : (history ?? [target]),
  };
}

// 対応案件一覧（物件・部屋付き）— ページネーション対応
export async function getCases(page = 1, pageSize = 50, sort = "reported_date:desc"): Promise<{ data: Row[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const [sortCol, sortDir] = sort.split(":") as [string, string];
  const { data, error, count } = await supabase
    .from("cases")
    .select("*, property:properties(name), unit:units(unit_number)", { count: "exact" })
    .order(sortCol, { ascending: sortDir === "asc" })
    .range(from, to);
  if (error) throw error;
  return { data: (data ?? []) as Row[], total: count ?? 0 };
}

// オーナー一覧（物件・部屋付き）
export async function getOwners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select("*, properties(id, name, management_fee_type, management_fee_rate, management_fee_amount, management_form, units(id, status, rent))")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Row[];
}

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

// 会社情報
export async function getCompany() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .single();
  if (error) throw error;
  return data as Row;
}

export async function getUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, is_active, created_at")
    .eq("is_active", true)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Row[];
}

// ダッシュボード用データ
export async function getDashboardData() {
  const supabase = await createClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in90days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
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
      .select("id, end_date, tenant:tenants(name), unit:units(unit_number, property_id, property:properties(name)), move_out_requests(id, status, desired_move_out_date)")
      .eq("status", "active")
      .gte("end_date", today)
      .lte("end_date", in90days),
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
      collection_rate: totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 1000) / 10 : 0,
      overdue_count: overdueBillings.length,
      overdue_amount: overdueAmount,
      open_cases: activeCases.length,
      alert_cases: alertCasesRes.count ?? 0,
      expiring_contracts: expiringContracts.length,
      pending_move_outs: pendingMoveOuts.length,
      monthly_expenses: monthlyExpenseTotal,
      pending_remittances: pendingRemittances.length,
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
  const { data: billings } = await supabase
    .from("rent_billings")
    .select("billing_month, status, total_amount, rent_payments(amount)")
    .gte("billing_month", sixMonthsAgo.toISOString().slice(0, 10));

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
    return {
      month,
      label: `${month.slice(5)}月`,
      totalAmount: total,
      paidAmount: paid,
      collectionRate: total > 0 ? Math.round((paid / total) * 100) : 0,
    };
  });

  return trend;
}

// 部屋セレクトリスト（物件名付き）
export async function getUnitsForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("id, unit_number, property:properties(name), contracts(tenant_id, status)")
    .order("unit_number");
  if (error) throw error;
  return (data ?? []).map((u: Row) => {
    const active = u.contracts?.find((c: Row) => c.status === "active");
    return {
      id: u.id,
      label: `${u.property?.name || ""} ${u.unit_number}`,
      tenant_id: active?.tenant_id || null,
    };
  });
}

// 入居者セレクトリスト（有効な契約がある入居者は除外）
export async function getTenantsForSelect(excludeContractId?: string) {
  const supabase = await createClient();

  const [{ data: tenants, error: tErr }, { data: activeContracts, error: cErr }] =
    await Promise.all([
      supabase.from("tenants").select("id, name").order("name"),
      supabase.from("contracts").select("id, tenant_id").eq("status", "active"),
    ]);
  if (tErr) throw tErr;
  if (cErr) throw cErr;

  const activeTenantIds = new Set(
    (activeContracts ?? [])
      .filter((c: Row) => c.id !== excludeContractId)
      .map((c: Row) => c.tenant_id)
  );

  return (tenants ?? [])
    .filter((t: Row) => !activeTenantIds.has(t.id))
    .map((t: Row) => ({
      id: t.id,
      label: t.name,
    }));
}

// 全入居者セレクトリスト（問い合わせ・修繕など契約状態を問わない用途）
export async function getAllTenantsForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((t: Row) => ({ id: t.id, label: t.name }));
}

// 物件セレクトリスト
export async function getPropertiesForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, owner_id, default_allocation_method")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((p: Row) => ({
    id: p.id,
    label: p.name,
    owner_id: p.owner_id,
    default_allocation_method: p.default_allocation_method,
  }));
}

// 社内ユーザーセレクトリスト（承認者選択など用途）
export async function getUsersForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((u: Row) => ({
    id: u.id,
    label: u.name,
    role: u.role,
  }));
}

// 送金一覧
export async function getRemittances() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owner_remittances")
    .select("*, owner:owners(name)")
    .order("remittance_month", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Row[];
}

// オーナーセレクトリスト
export async function getOwnersForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((o: Row) => ({
    id: o.id,
    label: o.name,
  }));
}

export async function getPayeesForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payees")
    .select("id, name, category")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((p: Row) => ({
    id: p.id,
    label: p.name,
    category: p.category,
  }));
}

// バッジカウント + 会社設定（Sidebar用API）
export async function getBadgeCounts() {
  const supabase = await createClient();

  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - 3);
  const staleDate = staleThreshold.toISOString();

  const [overdueRes, casesUrgentRes, casesStaleRes, companyRes, authRes] =
    await Promise.all([
      supabase
        .from("rent_billings")
        .select("id", { count: "exact", head: true })
        .eq("status", "overdue"),
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .in("priority", ["high", "urgent"]),
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .in("priority", ["low", "normal"])
        .lt("created_at", staleDate),
      supabase.from("companies").select("name, contract_alert_days").single(),
      supabase.auth.getUser(),
    ]);

  const alertDays = (companyRes.data?.contract_alert_days as number) ?? 90;
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + alertDays);
  const today = new Date().toISOString().slice(0, 10);
  const alertDateStr = alertDate.toISOString().slice(0, 10);

  // 「更新間近」= 満了がアラート期間内の有効契約。ただし退去予告（pending/approved）が
  // 出ている契約はもう更新しないので除外する（契約一覧の「更新間近」タブと定義を揃える）。
  const contractsPromise = supabase
    .from("contracts")
    .select("id, move_out_requests(status)")
    .eq("status", "active")
    .gte("end_date", today)
    .lte("end_date", alertDateStr);

  const profilePromise = authRes.data?.user
    ? supabase.from("users").select("name, email").eq("id", authRes.data.user.id).single()
    : Promise.resolve({ data: null });

  const [contractsRes, profileRes] = await Promise.all([contractsPromise, profilePromise]);

  const userEmail = profileRes.data?.email ?? authRes.data?.user?.email ?? "";
  const userName = profileRes.data?.name ?? "";

  const rent = overdueRes.count ?? 0;
  const cases = (casesUrgentRes.count ?? 0) + (casesStaleRes.count ?? 0);
  const contracts = ((contractsRes.data ?? []) as Row[]).filter((c: Row) => {
    const reqs = (c.move_out_requests ?? []) as Row[];
    return !reqs.some((r: Row) => r.status === "pending" || r.status === "approved");
  }).length;
  const dashboard = rent + cases + contracts;

  return {
    "/": dashboard,
    "/rent": rent,
    "/cases": cases,
    "/contracts": contracts,
    company_name: (companyRes.data?.name as string) ?? "",
    contract_alert_days: alertDays,
    user_name: userName,
    user_email: userEmail,
  };
}
