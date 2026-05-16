import { getMaintenanceRequests, getPropertiesForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import MaintenancePageClient from "@/components/MaintenancePageClient";
import MaintenanceTable from "@/components/MaintenanceTable";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const [maintenanceRequests, properties] = await Promise.all([
    getMaintenanceRequests(),
    getPropertiesForSelect(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Maintenance"
        title="修繕"
        em="管理"
        description={`${maintenanceRequests.length}件の修繕依頼`}
        action={<MaintenancePageClient properties={properties} />}
      />

      <MaintenanceTable data={maintenanceRequests} initialFilter={filter} />
    </>
  );
}
