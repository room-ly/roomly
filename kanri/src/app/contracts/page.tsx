import { Suspense } from "react";
import { getContracts, getUnitsForSelect, getTenantsForSelect, getCompany } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import ContractsPageClient from "@/components/ContractsPageClient";
import ContractsTable from "@/components/ContractsTable";
import ServerPagination from "@/components/ServerPagination";
import SortSelect from "@/components/SortSelect";

const PAGE_SIZE = 50;
const SORT_OPTIONS = [
  { value: "start_date:desc", label: "開始日（新しい順）" },
  { value: "start_date:asc", label: "開始日（古い順）" },
  { value: "end_date:asc", label: "満了日（近い順）" },
  { value: "rent:desc", label: "賃料（高い順）" },
  { value: "rent:asc", label: "賃料（安い順）" },
];

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { page: pageStr, sort } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const sortValue = sort || "start_date:desc";
  const [{ data: contracts, total }, units, tenants, company] = await Promise.all([
    getContracts(page, PAGE_SIZE, sortValue),
    getUnitsForSelect(),
    getTenantsForSelect(),
    getCompany(),
  ]);

  const alertDays = (company as any).contract_alert_days ?? 90;

  return (
    <>
      <PageHeader
        eyebrow="Contracts"
        title="契約"
        em={`${total}件`}
        description="入居者との賃貸借契約一覧。更新期限・退去申請をひと目で把握できます。"
        action={<ContractsPageClient units={units} tenants={tenants} />}
      />

      <div className="flex justify-end mb-3">
        <Suspense><SortSelect options={SORT_OPTIONS} defaultValue={sortValue} /></Suspense>
      </div>
      <ContractsTable data={contracts} alertDays={alertDays} />
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
