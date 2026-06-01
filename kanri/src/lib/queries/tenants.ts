import { createClient, type Row } from "./_shared";
import { isOverdue } from "@/lib/billing-status";

// 入居者一覧（アクティブ契約・部屋・物件情報付き）
export async function getTenantsWithInfo() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [tenantsRes, contractsRes, overdueBillingsRes] = await Promise.all([
    supabase.from("tenants").select("*").order("name"),
    supabase
      .from("contracts")
      .select(
        "id, tenant_id, unit_id, rent, status, unit:units(unit_number, property:properties(name))"
      )
      .eq("status", "active"),
    supabase
      .from("rent_billings")
      .select("contract_id, total_amount, due_date, rent_payments(amount)")
      .lt("due_date", today),
  ]);

  const tenants = (tenantsRes.data ?? []) as Row[];
  const contracts = (contractsRes.data ?? []) as Row[];
  const overdueContractIds = new Set(
    ((overdueBillingsRes.data ?? []) as Row[])
      .filter((b) => isOverdue(b as any, today))
      .map((b) => b.contract_id as string)
  );

  return tenants.map((t: Row) => {
    const contract = contracts.find((c: Row) => c.tenant_id === t.id);
    return {
      ...t,
      contract: contract ?? null,
      _has_overdue: contract ? overdueContractIds.has(contract.id as string) : false,
    };
  });
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
