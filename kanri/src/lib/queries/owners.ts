import { createClient, withEffectiveRent, type Row } from "./_shared";

// オーナーにぶら下がる units の rent を実効家賃（入居中=契約 / 空室=募集賃料）に差し替える
function applyEffectiveRentToOwner(owner: Row): Row {
  return {
    ...owner,
    properties: (owner.properties ?? []).map((p: Row) => ({
      ...p,
      units: (p.units ?? []).map((u: Row) => withEffectiveRent(u)),
    })),
  };
}

// units にアクティブ契約の家賃をネストして取得する select 句
const OWNER_UNITS_SELECT =
  "*, properties(id, name, management_fee_type, management_fee_rate, management_fee_amount, management_form, units(id, status, rent, management_fee, contracts(rent, management_fee, status, voided_at)))";

// オーナー一覧（物件・部屋付き）
export async function getOwners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owners")
    .select(OWNER_UNITS_SELECT)
    .order("name");
  if (error) throw error;
  return ((data ?? []) as Row[]).map(applyEffectiveRentToOwner);
}

// オーナー詳細（物件・送金履歴付き）
export async function getOwnerDetail(id: string) {
  const supabase = await createClient();
  const [{ data: owner, error }, { data: remittances }] = await Promise.all([
    supabase.from("owners").select(OWNER_UNITS_SELECT).eq("id", id).single(),
    supabase.from("owner_remittances").select("id, remittance_month, total_rent, management_fee_deducted, expense_deducted, net_amount, status").eq("owner_id", id).order("remittance_month", { ascending: false }).limit(12),
  ]);
  if (error || !owner) return null;

  return { owner: applyEffectiveRentToOwner(owner), remittances: remittances ?? [] };
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
