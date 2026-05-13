import { getExpenses, getPropertiesForSelect, getOwnersForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import ExpensesPageClient from "@/components/ExpensesPageClient";
import ExpensesTable from "@/components/ExpensesTable";

export default async function ExpensesPage() {
  const [expenses, properties, owners] = await Promise.all([
    getExpenses(),
    getPropertiesForSelect(),
    getOwnersForSelect(),
  ]);

  const totalAmount = expenses.reduce(
    (s: number, e: any) => s + Number(e.amount),
    0
  );
  const ownerChargeAmount = expenses
    .filter((e: any) => e.is_owner_charge)
    .reduce((s: number, e: any) => s + Number(e.amount), 0);
  const companyChargeAmount = totalAmount - ownerChargeAmount;

  const byCategory = expenses.reduce(
    (acc: Record<string, number>, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <>
      <PageHeader
        title="経費管理"
        description="物件経費・オーナー負担の管理"
        action={<ExpensesPageClient properties={properties} owners={owners} />}
      />

      {/* サマリー */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">経費総額</p>
          <p className="text-xl font-semibold tabular-nums">¥{totalAmount.toLocaleString()}</p>
        </div>
        <div className="card p-4 border-l-[3px] border-l-warn">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">オーナー負担</p>
          <p className="text-xl font-semibold text-warn tabular-nums">¥{ownerChargeAmount.toLocaleString()}</p>
          <p className="text-[11px] text-ink-3 mt-0.5">送金時に控除</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">管理会社負担</p>
          <p className="text-xl font-semibold text-accent tabular-nums">¥{companyChargeAmount.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">登録件数</p>
          <p className="text-xl font-semibold tabular-nums">{expenses.length}件</p>
        </div>
      </div>

      {/* カテゴリ別内訳 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {Object.entries(byCategory).map(([cat, amount]) => (
          <div
            key={cat}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface shadow-sm text-[12px]"
          >
            <StatusBadge status={cat} />
            <span className="font-medium tabular-nums">
              ¥{(amount as number).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <ExpensesTable data={expenses} properties={properties} owners={owners} />
    </>
  );
}
