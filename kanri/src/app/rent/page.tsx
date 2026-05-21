import { Suspense } from "react";
import { getRentBillings, getOverdueAging } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import RentTable from "@/components/RentTable";
import ServerPagination from "@/components/ServerPagination";
import SortSelect from "@/components/SortSelect";
import OverdueAgingCard from "@/components/OverdueAgingCard";
import { CsvImportButton, BulkGenerateButton } from "@/components/RentPageClient";

const PAGE_SIZE = 50;
const SORT_OPTIONS = [
  { value: "billing_month:desc", label: "対象月（新しい順）" },
  { value: "billing_month:asc", label: "対象月（古い順）" },
  { value: "total_amount:desc", label: "金額（高い順）" },
  { value: "total_amount:asc", label: "金額（安い順）" },
  { value: "due_date:asc", label: "期限（近い順）" },
];

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; sort?: string }>;
}) {
  const { page: pageStr, sort } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const sortValue = sort || "billing_month:desc";
  const [{ data: billings, total }, aging] = await Promise.all([
    getRentBillings(page, PAGE_SIZE, sortValue),
    getOverdueAging(),
  ]);

  return (
    <>
      <PageHeader eyebrow="Rent" title="家賃" em="管理" description="家賃請求・入金状況の管理。滞納の追跡と入金確認を行います。" action={<div className="flex gap-2"><BulkGenerateButton /><CsvImportButton /></div>} />
      <OverdueAgingCard {...aging} />
      <div className="flex justify-end mb-3">
        <Suspense><SortSelect options={SORT_OPTIONS} defaultValue={sortValue} /></Suspense>
      </div>
      <Suspense>
        <RentTable data={billings} />
      </Suspense>
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
