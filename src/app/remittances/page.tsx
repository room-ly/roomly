import { Fragment } from "react";
import { getOwners, getExpenses, getRemittances } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import RemittancesPageClient from "@/components/RemittancesPageClient";

export default async function RemittancesPage() {
  const [owners, expenses, remittances] = await Promise.all([
    getOwners(),
    getExpenses(),
    getRemittances(),
  ]);

  const ownerExpenses = expenses
    .filter((e: any) => e.is_owner_charge && e.owner_id)
    .reduce((acc: Record<string, number>, e: any) => {
      acc[e.owner_id] = (acc[e.owner_id] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

  const propertyExpenses = expenses
    .filter((e: any) => e.is_owner_charge)
    .reduce((acc: Record<string, number>, e: any) => {
      if (e.property_id) {
        acc[e.property_id] = (acc[e.property_id] || 0) + Number(e.amount);
      }
      return acc;
    }, {} as Record<string, number>);

  const ownersWithBreakdown = owners.map((o: Record<string, any>) => {
    const ownerProps = o.properties || [];
    const ownerUnits = ownerProps.flatMap((p: any) => p.units || []);
    const occupiedUnits = ownerUnits.filter((u: any) => u.status === "occupied");
    const totalRent = occupiedUnits.reduce((s: number, u: any) => s + Number(u.rent), 0);
    const managementFee = Math.round(totalRent * (Number(o.management_fee_rate) / 100));
    const expenseDeducted = ownerExpenses[o.id] || 0;

    const propertyBreakdown = ownerProps.map((p: any) => {
      const pUnits = (p.units || []).filter((u: any) => u.status === "occupied");
      const pRent = pUnits.reduce((s: number, u: any) => s + Number(u.rent), 0);
      const pFee = Math.round(pRent * (Number(o.management_fee_rate) / 100));
      const pExpense = propertyExpenses[p.id] || 0;
      return {
        propertyId: p.id,
        propertyName: p.name,
        unitCount: (p.units || []).length,
        occupiedCount: pUnits.length,
        rent: pRent,
        fee: pFee,
        expense: pExpense,
        net: pRent - pFee - pExpense,
      };
    });

    return {
      ...o,
      totalRent,
      managementFee,
      expenseDeducted,
      netAmount: totalRent - managementFee - expenseDeducted,
      propertyBreakdown,
    };
  });

  const totalNet = ownersWithBreakdown.reduce((s: number, o: any) => s + o.netAmount, 0);
  const totalRent = ownersWithBreakdown.reduce((s: number, o: any) => s + o.totalRent, 0);
  const totalFee = ownersWithBreakdown.reduce((s: number, o: any) => s + o.managementFee, 0);

  return (
    <>
      <PageHeader
        title="送金管理"
        description="オーナーへの月次送金"
      />

      {/* サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 mb-1">家賃収入合計</p>
          <p className="text-[17px] font-semibold tabular-nums">¥{totalRent.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 mb-1">管理手数料合計</p>
          <p className="text-[17px] font-semibold text-danger tabular-nums">¥{totalFee.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 mb-1">送金額合計</p>
          <p className="text-[17px] font-semibold text-accent tabular-nums">¥{totalNet.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 mb-1">オーナー数</p>
          <p className="text-[17px] font-semibold tabular-nums">{owners.length}名</p>
        </div>
      </div>

      {/* 物件別内訳テーブル */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-line">
          <h2 className="text-[13px] font-semibold">月次送金明細（物件別内訳）</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-ink-3 border-b border-line">
                <th className="px-5 py-2.5 font-medium">オーナー</th>
                <th className="px-5 py-2.5 font-medium">物件</th>
                <th className="px-5 py-2.5 font-medium text-center">入居/総戸</th>
                <th className="px-5 py-2.5 font-medium text-right">家賃収入</th>
                <th className="px-5 py-2.5 font-medium text-right">管理手数料</th>
                <th className="px-5 py-2.5 font-medium text-right">経費控除</th>
                <th className="px-5 py-2.5 font-medium text-right">送金額</th>
              </tr>
            </thead>
            <tbody>
              {ownersWithBreakdown.map((o: Record<string, any>) => (
                <Fragment key={o.id}>
                  {o.propertyBreakdown.map((p: Record<string, any>, i: number) => (
                    <tr
                      key={`${o.id}-${p.propertyId}`}
                      className="border-b border-line hover:bg-bg-2/30 transition-colors"
                    >
                      {i === 0 && (
                        <td className="px-5 py-2.5 font-medium" rowSpan={o.propertyBreakdown.length + 1}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-accent-tint flex items-center justify-center text-accent text-[10px] font-semibold">
                              {o.name.charAt(0)}
                            </div>
                            <div>
                              <div>{o.name}</div>
                              <div className="text-[10px] text-ink-3 font-normal">手数料 {Number(o.management_fee_rate)}%</div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-2.5 text-ink-2">{p.propertyName}</td>
                      <td className="px-5 py-2.5 text-center tabular-nums">{p.occupiedCount}/{p.unitCount}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">¥{p.rent.toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right text-danger tabular-nums">-¥{p.fee.toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right text-warn tabular-nums">
                        {p.expense > 0 ? `-¥${p.expense.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right font-medium tabular-nums">¥{p.net.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr key={`${o.id}-total`} className="bg-bg-2/30 font-medium border-b border-line">
                    <td className="px-5 py-2 text-right text-ink-3 text-[11px]" colSpan={2}>合計</td>
                    <td className="px-5 py-2 text-right tabular-nums">¥{o.totalRent.toLocaleString()}</td>
                    <td className="px-5 py-2 text-right text-danger tabular-nums">-¥{o.managementFee.toLocaleString()}</td>
                    <td className="px-5 py-2 text-right text-warn tabular-nums">
                      {o.expenseDeducted > 0 ? `-¥${o.expenseDeducted.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-5 py-2 text-right text-accent tabular-nums">¥{o.netAmount.toLocaleString()}</td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 送金履歴 + 作成・編集 */}
      <RemittancesPageClient
        owners={owners.map((o: Record<string, any>) => ({ id: o.id, name: o.name }))}
        remittances={remittances}
      />
    </>
  );
}
