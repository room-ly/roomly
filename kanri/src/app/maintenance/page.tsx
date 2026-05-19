import { getMaintenanceRequests, getPropertiesForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import MaintenancePageClient from "@/components/MaintenancePageClient";
import MaintenanceTable from "@/components/MaintenanceTable";
import ServerPagination from "@/components/ServerPagination";

const PAGE_SIZE = 50;

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const { filter, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const [{ data: maintenanceRequests, total }, properties] = await Promise.all([
    getMaintenanceRequests(page, PAGE_SIZE),
    getPropertiesForSelect(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Maintenance"
        title="修繕"
        em="管理"
        description={`${total}件の修繕依頼`}
        action={<MaintenancePageClient properties={properties} />}
      />

      <MaintenanceTable data={maintenanceRequests} initialFilter={filter} />
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
