import { createClient } from "@/lib/supabase-server";
import { getCompanyId } from "@/lib/supabase-server";
import PageHeader from "@/components/PageHeader";
import PaymentsPageClient from "@/components/PaymentsPageClient";
import { APPROVED_EXPENSE_STATUSES } from "@/lib/remittance-data";

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
    // 業者への支払い候補。誤振込・二重振込を防ぐため厳しく絞る:
    //  - payee_id あり（振込先がある）
    //  - paid_by='company'（管理会社が払うもの。owner_direct=オーナー直接払いは除外）
    //  - paid_at IS NULL（まだ支払っていない）
    //  - 承認済みステータス（draft/却下は出さない）
    supabase
      .from("expenses")
      .select("id, expense_date, description, amount, category, payee:payees(id, name, bank_code, branch_code, account_number, account_holder_kana)")
      .eq("company_id", company_id)
      .not("payee_id", "is", null)
      .eq("paid_by", "company")
      .is("paid_at", null)
      .in("status", APPROVED_EXPENSE_STATUSES)
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
        description="オーナーへの送金と、業者（修理会社等）への費用支払いをまとめて選択し、全銀フォーマットCSVを出力します。CSVを出力した費用は支払済みになります。"
      />
      <PaymentsPageClient remittances={remittances} expenses={expenses} />
    </>
  );
}
