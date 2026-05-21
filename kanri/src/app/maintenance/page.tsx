import { Suspense } from "react";
import { getMaintenanceRequests, getPropertiesForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import MaintenancePageClient from "@/components/MaintenancePageClient";
import MaintenanceTable from "@/components/MaintenanceTable";
import ServerPagination from "@/components/ServerPagination";
import SortSelect from "@/components/SortSelect";

const PAGE_SIZE = 50;
const SORT_OPTIONS = [
  { value: "reported_date:desc", label: "報告日（新しい順）" },
  { value: "reported_date:asc", label: "報告日（古い順）" },
  { value: "priority:desc", label: "優先度（高い順）" },
  { value: "estimated_cost:desc", label: "見積額（高い順）" },
];

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string; sort?: string }>;
}) {
  const { filter, page: pageStr, sort } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const sortValue = sort || "reported_date:desc";
  const [{ data: maintenanceRequests, total }, properties] = await Promise.all([
    getMaintenanceRequests(page, PAGE_SIZE, sortValue),
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

      <div className="flex justify-end mb-3">
        <Suspense><SortSelect options={SORT_OPTIONS} defaultValue={sortValue} /></Suspense>
      </div>
      <MaintenanceTable data={maintenanceRequests} initialFilter={filter} />
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
