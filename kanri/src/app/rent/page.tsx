import { Suspense } from "react";
import { getRentBillings } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import RentTable from "@/components/RentTable";
import ServerPagination from "@/components/ServerPagination";
import { CsvImportButton, BulkGenerateButton } from "@/components/RentPageClient";

const PAGE_SIZE = 50;

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageStr, status } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const { data: billings, total } = await getRentBillings(page, PAGE_SIZE);

  return (
    <>
      <PageHeader eyebrow="Rent" title="家賃" em="管理" description="家賃請求・入金状況の管理。滞納の追跡と入金確認を行います。" action={<div className="flex gap-2"><BulkGenerateButton /><CsvImportButton /></div>} />
      <Suspense>
        <RentTable data={billings} />
      </Suspense>
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
