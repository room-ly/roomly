import { createClient, getCompanyId } from "@/lib/supabase-server";
import PageHeader from "@/components/PageHeader";
import { getBatchCandidates } from "@/lib/payment-batch-service";
import NewBatchClient from "@/components/NewBatchClient";

async function getData() {
  const supabase = await createClient();
  const company_id = await getCompanyId();
  const [{ remittances, expenses }, { data: banks }, { data: payees }] = await Promise.all([
    getBatchCandidates(supabase, company_id),
    supabase
      .from("company_bank_accounts")
      .select("id, label, account_holder, is_default")
      .eq("company_id", company_id)
      .order("is_default", { ascending: false }),
    // 行内で支払先を設定するための選択肢（口座情報の有無も判定に使う）
    supabase
      .from("payees")
      .select("id, name, bank_code, branch_code, account_number, account_holder_kana")
      .eq("company_id", company_id)
      .order("name"),
  ]);
  return {
    remittances,
    expenses,
    banks: (banks ?? []) as Record<string, any>[],
    payees: (payees ?? []) as Record<string, any>[],
  };
}

export default async function NewBatchPage() {
  const { remittances, expenses, banks, payees } = await getData();

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title="振込バッチを作成"
        em="対象を選択"
        description="この振込で振り込む対象（オーナー送金・業者支払い）を選びます。支払先が未設定の費用は、その場で支払先を設定すると選べるようになります。"
      />
      <NewBatchClient remittances={remittances} expenses={expenses} banks={banks} payees={payees as any} />
    </>
  );
}
