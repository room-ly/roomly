import { createClient } from "@/lib/supabase-server";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = any;

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

  const { data: property, error } = await supabase
    .from("properties")
    .select("*, owner:owners(id, name)")
    .eq("id", id)
    .single();
  if (error || !property) return null;

  const { data: units } = await supabase
    .from("units")
    .select("*")
    .eq("property_id", id)
    .order("unit_number");

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

  const visibleIds = await getVisibleUnitIds();
  const visibleUnits = applyUnitVisibility(units ?? [], visibleIds);

  return { property, units: visibleUnits, contracts };
}

// 部屋詳細（物件・アクティブ契約・入居者付き）
export async function getUnitDetail(unitId: string) {
  const supabase = await createClient();

  const { data: unit, error } = await supabase
    .from("units")
    .select("*, property:properties(id, name, address)")
    .eq("id", unitId)
    .single();
  if (error || !unit) return null;

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*, tenant:tenants(id, name, phone, email)")
    .eq("unit_id", unitId)
    .order("start_date", { ascending: false });

  const { data: maintenanceRequests } = await supabase
    .from("maintenance_requests")
    .select("*")
    .eq("unit_id", unitId)
    .order("reported_date", { ascending: false })
    .limit(5);

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

// 契約一覧（入居者・部屋・物件付き）
export async function getContracts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(
      "*, tenant:tenants(name), unit:units(unit_number, property:properties(name))"
    )
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Row[];
}

// 契約詳細（入居者・部屋・物件・家賃請求履歴付き）
export async function getContractDetail(id: string) {
  const supabase = await createClient();
  const { data: contract, error } = await supabase
    .from("contracts")
    .select(
      "*, tenant:tenants(id, name, name_kana, phone, email, workplace), unit:units(id, unit_number, floor_area_sqm, layout, property:properties(id, name, address))"
    )
    .eq("id", id)
    .single();
  if (error) console.error("[getContractDetail]", id, error.message, error.code);
  if (error || !contract) return null;

  const { data: billings } = await supabase
    .from("rent_billings")
    .select("id, billing_month, total_amount, status")
    .eq("contract_id", id)
    .order("billing_month", { ascending: false })
    .limit(12);

  return { contract, billings: billings ?? [] };
}

// 入居者詳細（契約・物件・家賃請求付き）
export async function getTenantDetail(id: string) {
  const supabase = await createClient();
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !tenant) return null;

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*, unit:units(unit_number, property:properties(name))")
    .eq("tenant_id", id)
    .order("start_date", { ascending: false });

  return { tenant, contracts: contracts ?? [] };
}

// 修繕依頼詳細（物件・部屋・対応履歴付き）
export async function getMaintenanceDetail(id: string) {
  const supabase = await createClient();
  const { data: request, error } = await supabase
    .from("maintenance_requests")
    .select("*, property:properties(id, name, address), unit:units(unit_number)")
    .eq("id", id)
    .single();
  if (error || !request) return null;

  const { data: logs } = await supabase
    .from("maintenance_logs")
    .select("*")
    .eq("maintenance_request_id", id)
    .order("created_at", { ascending: false });

  return { request, logs: logs ?? [] };
}

// 問い合わせ詳細（物件・部屋・入居者・対応履歴付き）
export async function getInquiryDetail(id: string) {
  const supabase = await createClient();
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .select("*, property:properties(id, name), unit:units(unit_number), tenant:tenants(name, phone, email)")
    .eq("id", id)
    .single();
  if (error || !inquiry) return null;

  const { data: logs } = await supabase
    .from("inquiry_logs")
    .select("*")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: false });

  return { inquiry, logs: logs ?? [] };
}

// オーナー詳細（物件・送金履歴付き）
export async function getOwnerDetail(id: string) {
  const supabase = await createClient();
  const { data: owner, error } = await supabase
    .from("owners")
    .select("*, properties(id, name, units(id, status, rent))")
    .eq("id", id)
    .single();
  if (error || !owner) return null;

  const { data: remittances } = await supabase
    .from("owner_remittances")
    .select("id, remittance_month, total_rent, management_fee_deducted, expense_deducted, net_amount, status")
    .eq("owner_id", id)
    .order("remittance_month", { ascending: false })
    .limit(12);

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
  const { data: remittance, error } = await supabase
    .from("owner_remittances")
    .select("*, owner:owners(id, name, phone, email, bank_name, bank_branch, account_type, account_holder)")
    .eq("id", id)
    .single();
  if (error || !remittance) return null;

  const { data: items } = await supabase
    .from("owner_remittance_items")
    .select("*, property:properties(name), unit:units(unit_number)")
    .eq("remittance_id", id)
    .order("created_at");

  return { remittance, items: items ?? [] };
}

// 家賃請求一覧（契約・入居者・物件付き）
export async function getRentBillings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rent_billings")
    .select(
      "*, contract:contracts(id, tenant:tenants(name, phone), unit:units(unit_number, property:properties(name)))"
    )
    .order("billing_month", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Row[];
}

// 家賃請求詳細 — 指定IDの請求を起点に、同一契約の全請求を時系列で返す
export async function getRentBillingDetail(id: string) {
  const supabase = await createClient();
  const { data: target, error: targetErr } = await supabase
    .from("rent_billings")
    .select(
      "*, contract:contracts(id, tenant:tenants(name, phone, email), unit:units(unit_number, property:properties(name, address))), rent_payments(id, amount, payment_date, payment_method, notes, created_at)"
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

// 修繕依頼一覧（物件・部屋付き）
export async function getMaintenanceRequests() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("*, property:properties(name), unit:units(unit_number)")
    .order("reported_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Row[];
}

// 問い合わせ一覧（物件・部屋・入居者付き）
export async function getInquiries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*, property:properties(name), unit:units(unit_number), tenant:tenants(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Row[];
}

// オーナー一覧（物件・部屋付き）
export async function getOwners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select("*, properties(id, name, units(id, status, rent))")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Row[];
}

// 経費一覧（物件・部屋・オーナー付き）
export async function getExpenses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "*, property:properties(name), unit:units(unit_number), owner:owners(name)"
    )
    .order("expense_date", { ascending: false });
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

  const [
    { data: properties },
    { data: units },
    { data: billings },
    { data: maintenance },
    { data: inquiries },
    { data: contracts },
    { data: pipelineUnits },
  ] = await Promise.all([
    supabase.from("properties").select("id"),
    supabase.from("units").select("id, status, rent"),
    supabase
      .from("rent_billings")
      .select("*, contract:contracts(id, tenant:tenants(name))")
      .order("billing_month", { ascending: false }),
    supabase
      .from("maintenance_requests")
      .select("*, property:properties(name)")
      .order("reported_date", { ascending: false }),
    supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("contracts")
      .select(
        "*, tenant:tenants(name), unit:units(unit_number, property_id, property:properties(name))"
      )
      .eq("status", "active"),
    supabase
      .from("units")
      .select("id, unit_number, status, rent, property_id, property:properties(name)")
      .in("status", ["maintenance", "vacant"]),
  ]);

  const allUnits = (units ?? []) as Row[];
  const allBillings = (billings ?? []) as Row[];
  const allMaintenance = (maintenance ?? []) as Row[];
  const allInquiries = (inquiries ?? []) as Row[];
  const allContracts = (contracts ?? []) as Row[];
  const allPipelineUnits = (pipelineUnits ?? []) as Row[];

  const totalUnits = allUnits.length;
  const occupiedUnits = allUnits.filter(
    (u: Row) => u.status === "occupied"
  ).length;
  const vacantUnits = allUnits.filter(
    (u: Row) => u.status === "vacant"
  ).length;

  const totalExpected = allBillings.reduce(
    (s: number, b: Row) => s + Number(b.total_amount),
    0
  );
  const totalReceived = allBillings
    .filter((b: Row) => b.status === "paid")
    .reduce((s: number, b: Row) => s + Number(b.total_amount), 0);

  const overdueBillings = allBillings.filter(
    (b: Row) => b.status === "overdue"
  );
  const overdueAmount = overdueBillings.reduce(
    (s: number, b: Row) => s + Number(b.total_amount),
    0
  );

  const activeMaintenance = allMaintenance.filter(
    (m: Row) => m.status === "open" || m.status === "in_progress"
  );
  const openInquiries = allInquiries.filter(
    (i: Row) => i.status === "open" || i.status === "in_progress"
  );

  const now = new Date();
  const expiringContracts = allContracts.filter((c: Row) => {
    if (!c.end_date) return false;
    const end = new Date(c.end_date);
    const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  });

  return {
    stats: {
      total_properties: (properties ?? []).length,
      total_units: totalUnits,
      occupied_units: occupiedUnits,
      vacant_units: vacantUnits,
      occupancy_rate:
        totalUnits > 0
          ? Math.round((occupiedUnits / totalUnits) * 1000) / 10
          : 0,
      total_rent_expected: totalExpected,
      total_rent_received: totalReceived,
      collection_rate:
        totalExpected > 0
          ? Math.round((totalReceived / totalExpected) * 1000) / 10
          : 0,
      overdue_count: overdueBillings.length,
      overdue_amount: overdueAmount,
      open_maintenance: activeMaintenance.length,
      open_inquiries: openInquiries.length,
      expiring_contracts: expiringContracts.length,
    },
    overdueBillings,
    activeMaintenance,
    expiringContracts,
    recentInquiries: openInquiries,
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
    .select("id, unit_number, property:properties(name)")
    .order("unit_number");
  if (error) throw error;
  return (data ?? []).map((u: Row) => ({
    id: u.id,
    label: `${u.property?.name || ""} ${u.unit_number}`,
  }));
}

// 入居者セレクトリスト
export async function getTenantsForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((t: Row) => ({
    id: t.id,
    label: t.name,
  }));
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

  const [overdueRes, maintenanceRes, inquiriesRes, moveOutRes, companyRes, authRes] =
    await Promise.all([
      supabase
        .from("rent_billings")
        .select("id", { count: "exact", head: true })
        .eq("status", "overdue"),
      supabase
        .from("maintenance_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),
      supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),
      supabase
        .from("move_out_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("companies").select("name, contract_alert_days").single(),
      supabase.auth.getUser(),
    ]);

  const alertDays = (companyRes.data?.contract_alert_days as number) ?? 90;
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + alertDays);
  const today = new Date().toISOString().slice(0, 10);
  const alertDateStr = alertDate.toISOString().slice(0, 10);

  const contractsRes = await supabase
    .from("contracts")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .gte("end_date", today)
    .lte("end_date", alertDateStr);

  // サーバーサイドでユーザープロフィールを取得
  let userName = "";
  let userEmail = authRes.data?.user?.email ?? "";
  if (authRes.data?.user) {
    const { data: profile } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", authRes.data.user.id)
      .single();
    if (profile) {
      userName = profile.name ?? "";
      userEmail = profile.email ?? userEmail;
    }
  }

  const rent = overdueRes.count ?? 0;
  const maintenance = maintenanceRes.count ?? 0;
  const inquiries = inquiriesRes.count ?? 0;
  const contracts = contractsRes.count ?? 0;
  const moveOut = moveOutRes.count ?? 0;
  const dashboard = rent + maintenance + inquiries + contracts + moveOut;

  return {
    "/": dashboard,
    "/rent": rent,
    "/maintenance": maintenance,
    "/inquiries": inquiries,
    "/contracts": contracts,
    "/move-out-requests": moveOut,
    company_name: (companyRes.data?.name as string) ?? "",
    contract_alert_days: alertDays,
    user_name: userName,
    user_email: userEmail,
  };
}
