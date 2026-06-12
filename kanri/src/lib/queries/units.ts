import { createClient, applyUnitVisibility, getVisibleUnitIds, type Row } from "./_shared";

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
    supabase.from("units").select("*, property:properties(id, name, address, property_type, management_form, management_fee_type, management_fee_rate, management_fee_amount, owner:owners(id, name, phone, email))").eq("id", unitId).single(),
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

// 部屋セレクトリスト（物件名付き）
export async function getUnitsForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("units")
    .select("id, unit_number, rent, management_fee, property:properties(name), contracts(tenant_id, status)")
    .order("unit_number");
  if (error) throw error;
  return (data ?? []).map((u: Row) => {
    const active = u.contracts?.find((c: Row) => c.status === "active");
    return {
      id: u.id,
      label: `${u.property?.name || ""} ${u.unit_number}`,
      tenant_id: active?.tenant_id || null,
      rent: u.rent,
      management_fee: u.management_fee,
      // 有効な契約があれば入居中（=新規契約の選択肢から除外）
      occupied: !!active,
    };
  });
}
