import { createClient, getCompanyId } from "@/lib/supabase-server";
import PageHeader from "@/components/PageHeader";
import { getBatchCandidates } from "@/lib/payment-batch-service";
import NewBatchClient from "@/components/NewBatchClient";

async function getData() {
  const supabase = await createClient();
  const company_id = await getCompanyId();
  const [{ remittances, expenses }, { data: banks }] = await Promise.all([
    getBatchCandidates(supabase, company_id),
    supabase
      .from("company_bank_accounts")
      .select("id, label, account_holder, is_default")
      .eq("company_id", company_id)
      .order("is_default", { ascending: false }),
  ]);
  return { remittances, expenses, banks: (banks ?? []) as Record<string, any>[] };
}

export default async function NewBatchPage() {
  const { remittances, expenses, banks } = await getData();

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title="振込バッチを作成"
        em="対象を選択"
        description="この振込で振り込む対象（オーナー送金・業者支払い）を選びます。口座情報がないものは選べません。"
      />
      <NewBatchClient remittances={remittances} expenses={expenses} banks={banks} />
    </>
  );
}
