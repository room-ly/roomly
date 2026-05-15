import { getTenantsWithInfo } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import TenantsPageClient from "@/components/TenantsPageClient";
import TenantsTable from "@/components/TenantsTable";

export default async function TenantsPage() {
  const tenantsWithInfo = await getTenantsWithInfo();

  return (
    <>
      <PageHeader
        title="入居者管理"
        description={`${tenantsWithInfo.length}名の入居者`}
        action={<TenantsPageClient />}
      />

      <TenantsTable data={tenantsWithInfo} />
    </>
  );
}
