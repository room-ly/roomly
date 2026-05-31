import { createClient, type Row } from "./_shared";

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
