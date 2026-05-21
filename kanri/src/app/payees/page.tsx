import { createClient } from "@/lib/supabase-server";
import { getCompanyId } from "@/lib/supabase-server";
import PageHeader from "@/components/PageHeader";
import PayeesPageClient from "@/components/PayeesPageClient";

async function getPayees() {
  const supabase = await createClient();
  const company_id = await getCompanyId();
  const { data, error } = await supabase
    .from("payees")
    .select("*")
    .eq("company_id", company_id)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export default async function PayeesPage() {
  const payees = await getPayees();

  return (
    <>
      <PageHeader
        eyebrow="Payees"
        title="支払先"
        em="マスタ"
        description="業者・保険会社など振込先の口座情報を管理。全銀CSV出力に使用します。"
        action={<PayeesPageClient payees={payees} />}
      />
    </>
  );
}
