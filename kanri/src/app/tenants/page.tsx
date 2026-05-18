import { getTenantsWithInfo } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import TenantsPageClient from "@/components/TenantsPageClient";
import TenantsTable from "@/components/TenantsTable";

export default async function TenantsPage() {
  const tenantsWithInfo = await getTenantsWithInfo();

  return (
    <>
      <PageHeader
        eyebrow="Tenants"
        title="入居者"
        em={`${tenantsWithInfo.length}名`}
        description="入居者一覧。レイアウト切替えで違う見せ方を比較できます。要対応の入居者を素早く特定するには「状態ボード」、点検時は「テーブル」が便利です。"
        action={<TenantsPageClient />}
      />

      <TenantsTable data={tenantsWithInfo} />
    </>
  );
}
