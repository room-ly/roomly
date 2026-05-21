import { Suspense } from "react";
import { getExpenses, getPropertiesForSelect, getOwnersForSelect, getPayeesForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import ExpensesPageClient from "@/components/ExpensesPageClient";
import ExpensesTable from "@/components/ExpensesTable";
import ServerPagination from "@/components/ServerPagination";
import SortSelect from "@/components/SortSelect";

const PAGE_SIZE = 50;
const SORT_OPTIONS = [
  { value: "expense_date:desc", label: "日付（新しい順）" },
  { value: "expense_date:asc", label: "日付（古い順）" },
  { value: "amount:desc", label: "金額（高い順）" },
  { value: "amount:asc", label: "金額（安い順）" },
];

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { page: pageStr, sort } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const sortValue = sort || "expense_date:desc";
  const [{ data: expenses, total }, properties, owners, payees] = await Promise.all([
    getExpenses(page, PAGE_SIZE, sortValue),
    getPropertiesForSelect(),
    getOwnersForSelect(),
    getPayeesForSelect(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Expenses"
        title="経費"
        em="管理"
        description="物件経費・オーナー負担の管理。送金時にオーナー負担分が自動で控除されます。"
        action={<ExpensesPageClient properties={properties} owners={owners} payees={payees} />}
      />

      <div className="flex justify-end mb-3">
        <Suspense><SortSelect options={SORT_OPTIONS} defaultValue={sortValue} /></Suspense>
      </div>
      <ExpensesTable data={expenses} />
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
