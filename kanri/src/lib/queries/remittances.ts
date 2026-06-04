import { createClient, type Row } from "./_shared";

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

// 管理会社の振込先口座（既定を優先）。
// 費用がオーナーの家賃収入を超過した不足分を、オーナーから入金してもらう先として表示する。
export async function getDefaultCompanyBankAccount(): Promise<Row | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_bank_accounts")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at")
    .limit(1);
  return (data?.[0] as Row) ?? null;
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
