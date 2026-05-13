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
        title="経費管理"
        description="物件経費・オーナー負担の管理"
        action={<ExpensesPageClient properties={properties} owners={owners} />}
      />

      <ExpensesTable data={expenses} properties={properties} owners={owners} />
    </>
  );
}
