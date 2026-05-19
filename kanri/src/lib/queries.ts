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

  const [{ data: unit, error }, { data: contracts }, { data: maintenanceRequests }] = await Promise.all([
    supabase.from("units").select("*, property:properties(id, name, address)").eq("id", unitId).single(),
    supabase.from("contracts").select("*, tenant:tenants(id, name, phone, email)").eq("unit_id", unitId).order("start_date", { ascending: false }),
    supabase.from("maintenance_requests").select("*").eq("unit_id", unitId).order("reported_date", { ascending: false }).limit(5),
  ]);
  if (error || !unit) return null;

  return {
    unit,
    contracts: contracts ?? [],
    maintenanceRequests: maintenanceRequests ?? [],
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
export async function getContracts(page = 1, pageSize = 50): Promise<{ data: Row[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("contracts")
    .select(
      "*, tenant:tenants(name), unit:units(id, unit_number, property_id, property:properties(id, name)), move_out_requests(id, status, desired_move_out_date)",
      { count: "exact" }
    )
    .order("start_date", { ascending: false })
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
  const [{ data: contract, error }, { data: billings }, { data: moveOutRequests }] = await Promise.all([
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

  return { contract, billings: billings ?? [], moveOutRequests: moveOutRequests ?? [], unitContracts };
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

// 修繕依頼詳細（物件・部屋・対応履歴付き）
export async function getMaintenanceDetail(id: string) {
  const supabase = await createClient();
  const [{ data: request, error }, { data: logs }] = await Promise.all([
    supabase.from("maintenance_requests").select("*, property:properties(id, name, address), unit:units(unit_number)").eq("id", id).single(),
    supabase.from("maintenance_logs").select("*").eq("request_id", id).order("logged_at", { ascending: false }),
  ]);
  if (error || !request) return null;

  return { request, logs: logs ?? [] };
}

// 問い合わせ詳細（物件・部屋・入居者・対応履歴付き）
export async function getInquiryDetail(id: string) {
  const supabase = await createClient();
  const [{ data: inquiry, error }, { data: logs }] = await Promise.all([
    supabase.from("inquiries").select("*, property:properties(id, name), unit:units(unit_number, contracts(tenant_id, status, tenant:tenants(id, name, phone, email))), tenant:tenants(name, phone, email)").eq("id", id).single(),
    supabase.from("inquiry_logs").select("*").eq("inquiry_id", id).order("created_at", { ascending: false }),
  ]);
  if (error || !inquiry) return null;

  if (!inquiry.tenant && inquiry.unit?.contracts) {
    const active = inquiry.unit.contracts.find((c: Row) => c.status === "active");
    if (active?.tenant) inquiry.tenant = active.tenant;
  }

  return { inquiry, logs: logs ?? [] };
}

// オーナー詳細（物件・送金履歴付き）
export async function getOwnerDetail(id: string) {
  const supabase = await createClient();
  const [{ data: owner, error }, { data: remittances }] = await Promise.all([
    supabase.from("owners").select("*, properties(id, name, management_fee_rate, units(id, status, rent))").eq("id", id).single(),
    supabase.from("owner_remittances").select("id, remittance_month, total_rent, management_fee_deducted, expense_deducted, net_amount, status").eq("owner_id", id).order("remittance_month", { ascending: false }).limit(12),
  ]);
  if (error || !owner) return null;

  return { owner, remittances: remittances ?? [] };
}

// 経費詳細
export async function getExpenseDetail(id: string) {
  const supabase = await createClient();
  const { data: expense, error } = await supabase
    .from("expenses")
    .select("*, property:properties(id, name, address), unit:units(unit_number), owner:owners(name)")
    .eq("id", id)
    .single();
  if (error || !expense) return null;
  return expense;
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

// 家賃請求一覧（契約・入居者・物件付き）— ページネーション対応
export async function getRentBillings(page = 1, pageSize = 50): Promise<{ data: Row[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("rent_billings")
    .select(
      "*, contract:contracts(id, tenant:tenants(name, phone), unit:units(unit_number, property:properties(name))), rent_payments(payment_date, amount)",
      { count: "exact" }
    )
    .order("billing_month", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data: (data ?? []) as Row[], total: count ?? 0 };
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

// 修繕依頼一覧（物件・部屋付き）— ページネーション対応
export async function getMaintenanceRequests(page = 1, pageSize = 50): Promise<{ data: Row[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("maintenance_requests")
    .select("*, property:properties(name), unit:units(unit_number)", { count: "exact" })
    .order("reported_date", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data: (data ?? []) as Row[], total: count ?? 0 };
}

// 問い合わせ一覧（物件・部屋・入居者付き）— ページネーション対応
export async function getInquiries(page = 1, pageSize = 50): Promise<{ data: Row[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("inquiries")
    .select("*, property:properties(id, name), unit:units(unit_number, contracts(tenant_id, status, tenant:tenants(id, name, phone, email))), tenant:tenants(id, name, phone, email), inquiry_logs(id, content, action_type, created_at)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  const rows = (data ?? []).map((row: Row) => {
    if (!row.tenant && row.unit?.contracts) {
      const active = row.unit.contracts.find((c: Row) => c.status === "active");
      if (active?.tenant) row.tenant = active.tenant;
    }
    return row;
  }) as Row[];
  return { data: rows, total: count ?? 0 };
}

// オーナー一覧（物件・部屋付き）
export async function getOwners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select("*, properties(id, name, management_fee_rate, units(id, status, rent))")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Row[];
}

// 経費一覧（物件・部屋・オーナー付き）— ページネーション対応
export async function getExpenses(page = 1, pageSize = 50): Promise<{ data: Row[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("expenses")
    .select(
      "*, property:properties(name), unit:units(unit_number), owner:owners(name)",
      { count: "exact" }
    )
    .order("expense_date", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data: (data ?? []) as Row[], total: count ?? 0 };
}

// 書類一覧（物件・部屋・入居者付き）
export async function getDocuments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*, property:properties(name), unit:units(unit_number), tenant:tenants(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Row[];
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
    activeMaintRes,
    alertMaintRes,
    openInqRes,
    alertInqRes,
    expiringRes,
    pendingMoveOutRes,
    pipelineUnitsRes,
    billingSummaryRes,
  ] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("units").select("id", { count: "exact", head: true }),
    supabase.from("units").select("id", { count: "exact", head: true }).eq("status", "occupied"),
    supabase.from("units").select("id", { count: "exact", head: true }).eq("status", "vacant"),
    supabase
      .from("rent_billings")
      .select("id, billing_month, total_amount, contract:contracts(id, tenant:tenants(name))")
      .eq("status", "overdue")
      .order("billing_month", { ascending: false }),
    supabase
      .from("maintenance_requests")
      .select("id, title, priority, status, reported_date, property:properties(name)")
      .in("status", ["open", "in_progress"])
      .order("reported_date", { ascending: false }),
    supabase
      .from("maintenance_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"])
      .in("priority", ["high", "urgent"]),
    supabase
      .from("inquiries")
      .select("id, title, priority, status, created_at")
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false }),
    supabase
      .from("inquiries")
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
      .select("total_amount, status, billing_month")
      .gte("billing_month", `${now.toISOString().slice(0, 7)}-01`)
      .lt("billing_month", `${new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)}`),
  ]);

  const overdueBillings = (overdueBillingsRes.data ?? []) as Row[];
  const activeMaintenance = (activeMaintRes.data ?? []) as Row[];
  const openInquiries = (openInqRes.data ?? []) as Row[];
  const expiringContracts = (expiringRes.data ?? []) as Row[];
  const pendingMoveOuts = (pendingMoveOutRes.data ?? []) as Row[];
  const allPipelineUnits = (pipelineUnitsRes.data ?? []) as Row[];
  const allBillings = (billingSummaryRes.data ?? []) as Row[];

  const totalUnits = unitTotal.count ?? 0;
  const occupiedUnits = unitOccupied.count ?? 0;
  const vacantUnitsCount = unitVacant.count ?? 0;
  const overdueAmount = overdueBillings.reduce((s: number, b: Row) => s + Number(b.total_amount), 0);
  const totalExpected = allBillings.reduce((s: number, b: Row) => s + Number(b.total_amount), 0);
  const totalReceived = allBillings.filter((b: Row) => b.status === "paid").reduce((s: number, b: Row) => s + Number(b.total_amount), 0);

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
      open_maintenance: activeMaintenance.length,
      alert_maintenance: alertMaintRes.count ?? 0,
      open_inquiries: openInquiries.length,
      alert_inquiries: alertInqRes.count ?? 0,
      expiring_contracts: expiringContracts.length,
      pending_move_outs: pendingMoveOuts.length,
    },
    overdueBillings,
    activeMaintenance,
    expiringContracts,
    pendingMoveOuts,
    openInquiries,
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

  // 月ごとの家賃請求データ
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const { data: billings } = await supabase
    .from("rent_billings")
    .select("billing_month, status, total_amount")
    .gte("billing_month", sixMonthsAgo.toISOString().slice(0, 10));

  const trend = months.map((month) => {
    const monthBillings = (billings ?? []).filter(
      (b: Row) => (b.billing_month as string)?.slice(0, 7) === month
    );
    const total = monthBillings.reduce(
      (s: number, b: Row) => s + Number(b.total_amount),
      0
    );
    const paid = monthBillings
      .filter((b: Row) => b.status === "paid")
      .reduce((s: number, b: Row) => s + Number(b.total_amount), 0);
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
    .select("id, name, owner_id")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((p: Row) => ({
    id: p.id,
    label: p.name,
    owner_id: p.owner_id,
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

// バッジカウント + 会社設定（Sidebar用API）
export async function getBadgeCounts() {
  const supabase = await createClient();

  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - 3);
  const staleDate = staleThreshold.toISOString();

  const [overdueRes, maintenanceUrgentRes, maintenanceStaleRes, inquiriesUrgentRes, inquiriesStaleRes, companyRes, authRes] =
    await Promise.all([
      supabase
        .from("rent_billings")
        .select("id", { count: "exact", head: true })
        .eq("status", "overdue"),
      supabase
        .from("maintenance_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .in("priority", ["high", "urgent"]),
      supabase
        .from("maintenance_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .in("priority", ["low", "normal"])
        .lt("created_at", staleDate),
      supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .in("priority", ["high", "urgent"]),
      supabase
        .from("inquiries")
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

  const contractsPromise = supabase
    .from("contracts")
    .select("id", { count: "exact", head: true })
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
  const maintenance = (maintenanceUrgentRes.count ?? 0) + (maintenanceStaleRes.count ?? 0);
  const inquiries = (inquiriesUrgentRes.count ?? 0) + (inquiriesStaleRes.count ?? 0);
  const contracts = contractsRes.count ?? 0;
  const dashboard = rent + maintenance + inquiries + contracts;

  return {
    "/": dashboard,
    "/rent": rent,
    "/maintenance": maintenance,
    "/inquiries": inquiries,
    "/contracts": contracts,
    company_name: (companyRes.data?.name as string) ?? "",
    contract_alert_days: alertDays,
    user_name: userName,
    user_email: userEmail,
  };
}
