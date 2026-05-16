import { getExpenses, getPropertiesForSelect, getOwnersForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import ExpensesPageClient from "@/components/ExpensesPageClient";
import ExpensesTable from "@/components/ExpensesTable";

export default async function ExpensesPage() {
  const [expenses, properties, owners] = await Promise.all([
    getExpenses(),
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
    </>
  );
}
