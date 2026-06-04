import { createClient } from "@/lib/supabase-server";
import { getCompanyId } from "@/lib/supabase-server";
import PageHeader from "@/components/PageHeader";
import PaymentsPageClient from "@/components/PaymentsPageClient";

async function getPaymentData() {
  const supabase = await createClient();
  const company_id = await getCompanyId();

  const [{ data: remittances }, { data: expenses }] = await Promise.all([
    supabase
      .from("owner_remittances")
      .select("id, remittance_month, net_amount, status, owner:owners(id, name, bank_code, bank_branch_code, bank_account_number, bank_account_holder)")
      .eq("company_id", company_id)
      .in("status", ["confirmed", "sent"])
      .order("remittance_month", { ascending: false })
      .limit(100),
    supabase
      .from("expenses")
      .select("id, expense_date, description, amount, category, payee:payees(id, name, bank_code, branch_code, account_number, account_holder_kana)")
      .eq("company_id", company_id)
      .not("payee_id", "is", null)
      .order("expense_date", { ascending: false })
      .limit(200),
  ]);

  return {
    remittances: (remittances ?? []) as Record<string, any>[],
    expenses: (expenses ?? []) as Record<string, any>[],
  };
}

export default async function PaymentsPage() {
  const { remittances, expenses } = await getPaymentData();

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title="支払い"
        em="一括出力"
        description="オーナー送金・費用支払いを選択して全銀フォーマットCSVを出力します。"
      />
      <PaymentsPageClient remittances={remittances} expenses={expenses} />
    </>
  );
}
