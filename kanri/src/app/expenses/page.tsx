import { getExpenses, getPropertiesForSelect, getOwnersForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import ExpensesPageClient from "@/components/ExpensesPageClient";
import ExpensesTable from "@/components/ExpensesTable";
import ServerPagination from "@/components/ServerPagination";

const PAGE_SIZE = 50;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const [{ data: expenses, total }, properties, owners] = await Promise.all([
    getExpenses(page, PAGE_SIZE),
    getPropertiesForSelect(),
    getOwnersForSelect(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Expenses"
        title="経費"
        em="管理"
        description="物件経費・オーナー負担の管理。送金時にオーナー負担分が自動で控除されます。"
        action={<ExpensesPageClient properties={properties} owners={owners} />}
      />

      <ExpensesTable data={expenses} />
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
