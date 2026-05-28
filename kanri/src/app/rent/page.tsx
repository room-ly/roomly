import { Suspense } from "react";
import { getRentBillings, getOverdueAging, getAvailableBillingMonths } from "@/lib/queries";
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

// 今月の billing_month を YYYY-MM-01 形式で返す
function currentBillingMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; sort?: string; month?: string }>;
}) {
  const { page: pageStr, sort, month, status } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const sortValue = sort || "billing_month:desc";

  // 月一覧を先に取得し、選択月の妥当性を判定
  const availableMonths = await getAvailableBillingMonths();
  // status指定時は全月対象（滞納一覧などからの遷移）。それ以外は month パラメータ or 今月 or 最新月
  let selectedMonth: string | undefined;
  if (month === "all" || status) {
    selectedMonth = undefined;
  } else if (month && availableMonths.includes(month)) {
    selectedMonth = month;
  } else {
    const current = currentBillingMonth();
    selectedMonth = availableMonths.includes(current) ? current : availableMonths[0];
  }

  const [{ data: billings, total }, aging] = await Promise.all([
    getRentBillings(page, PAGE_SIZE, sortValue, selectedMonth),
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
        <RentTable data={billings} availableMonths={availableMonths} selectedMonth={selectedMonth ?? "all"} />
      </Suspense>
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
