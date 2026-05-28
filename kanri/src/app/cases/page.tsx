import { Suspense } from "react";
import { getCases, getPropertiesForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import CasesPageClient from "@/components/CasesPageClient";
import CasesTable from "@/components/CasesTable";
import ServerPagination from "@/components/ServerPagination";
import SortSelect from "@/components/SortSelect";

const PAGE_SIZE = 50;
const SORT_OPTIONS = [
  { value: "reported_date:desc", label: "報告日（新しい順）" },
  { value: "reported_date:asc", label: "報告日（古い順）" },
  { value: "priority:desc", label: "優先度（高い順）" },
  { value: "estimated_cost:desc", label: "見積額（高い順）" },
];

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string; sort?: string }>;
}) {
  const { filter, page: pageStr, sort } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const sortValue = sort || "reported_date:desc";
  const [{ data: cases, total }, properties] = await Promise.all([
    getCases(page, PAGE_SIZE, sortValue),
    getPropertiesForSelect(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Cases"
        title="対応案件"
        em="管理"
        description={`${total}件の対応案件`}
        action={<CasesPageClient properties={properties} />}
      />

      <div className="flex justify-end mb-3">
        <Suspense><SortSelect options={SORT_OPTIONS} defaultValue={sortValue} /></Suspense>
      </div>
      <CasesTable data={cases} initialFilter={filter} />
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
