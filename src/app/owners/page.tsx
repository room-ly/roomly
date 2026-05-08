import { getOwners, getExpenses, getRemittances } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import OwnersPageClient from "@/components/OwnersPageClient";
import OwnerCard from "@/components/OwnerCard";

export default async function OwnersPage() {
  const [owners, expenses, remittances] = await Promise.all([getOwners(), getExpenses(), getRemittances()]);

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

  const ownersWithInfo = owners.map((o: Record<string, any>) => {
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
      propertyCount: ownerProps.length,
      unitCount: ownerUnits.length,
      occupiedCount: occupiedUnits.length,
      totalRent,
      managementFee,
      expenseDeducted,
      netAmount: totalRent - managementFee - expenseDeducted,
      propertyBreakdown,
    };
  });

  return (
    <>
      <PageHeader
        title="オーナー管理"
        description={`${owners.length}名のオーナー`}
        action={<OwnersPageClient />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {ownersWithInfo.map((o: Record<string, any>) => (
          <OwnerCard key={o.id} owner={o} />
        ))}
      </div>

      {/* 月次送金明細 */}
      <div className="mt-8">
        <h2 className="text-[14px] font-semibold mb-3">月次送金明細（物件別内訳）</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-text-muted border-b border-border-light">
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
                {ownersWithInfo.map((o: Record<string, any>) => (
                  <>
                    {o.propertyBreakdown.map(
                      (p: Record<string, any>, i: number) => (
                        <tr
                          key={`${o.id}-${p.propertyId}`}
                          className="border-b border-border-light hover:bg-bg-secondary/30 transition-colors"
                        >
                          {i === 0 && (
                            <td
                              className="px-5 py-2.5 font-medium"
                              rowSpan={o.propertyBreakdown.length + 1}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-accent/10 flex items-center justify-center text-accent text-[10px] font-semibold">
                                  {o.name.charAt(0)}
                                </div>
                                <div>
                                  <div>{o.name}</div>
                                  <div className="text-[10px] text-text-muted font-normal">
                                    手数料 {Number(o.management_fee_rate)}%
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}
                          <td className="px-5 py-2.5 text-text-secondary">
                            {p.propertyName}
                          </td>
                          <td className="px-5 py-2.5 text-center tabular-nums">
                            {p.occupiedCount}/{p.unitCount}
                          </td>
                          <td className="px-5 py-2.5 text-right tabular-nums">
                            ¥{p.rent.toLocaleString()}
                          </td>
                          <td className="px-5 py-2.5 text-right text-danger tabular-nums">
                            -¥{p.fee.toLocaleString()}
                          </td>
                          <td className="px-5 py-2.5 text-right text-warning tabular-nums">
                            {p.expense > 0
                              ? `-¥${p.expense.toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="px-5 py-2.5 text-right font-medium tabular-nums">
                            ¥{p.net.toLocaleString()}
                          </td>
                        </tr>
                      )
                    )}
                    <tr
                      key={`${o.id}-total`}
                      className="bg-bg-secondary/30 font-medium border-b border-border"
                    >
                      <td className="px-5 py-2 text-right text-text-muted text-[11px]" colSpan={2}>
                        合計
                      </td>
                      <td className="px-5 py-2 text-right tabular-nums">
                        ¥{o.totalRent.toLocaleString()}
                      </td>
                      <td className="px-5 py-2 text-right text-danger tabular-nums">
                        -¥{o.managementFee.toLocaleString()}
                      </td>
                      <td className="px-5 py-2 text-right text-warning tabular-nums">
                        {o.expenseDeducted > 0
                          ? `-¥${o.expenseDeducted.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-5 py-2 text-right text-accent tabular-nums">
                        ¥{o.netAmount.toLocaleString()}
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 送金履歴 */}
      {remittances.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[14px] font-semibold mb-3">送金履歴</h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-text-muted border-b border-border-light">
                    <th className="px-5 py-2.5 font-medium">対象月</th>
                    <th className="px-5 py-2.5 font-medium">オーナー</th>
                    <th className="px-5 py-2.5 font-medium text-right">家賃収入</th>
                    <th className="px-5 py-2.5 font-medium text-right">管理手数料</th>
                    <th className="px-5 py-2.5 font-medium text-right">経費控除</th>
                    <th className="px-5 py-2.5 font-medium text-right">送金額</th>
                    <th className="px-5 py-2.5 font-medium">状態</th>
                    <th className="px-5 py-2.5 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {remittances.map((r: Record<string, any>) => (
                    <tr key={r.id} className="border-b border-border-light last:border-0 hover:bg-bg-secondary/30 transition-colors">
                      <td className="px-5 py-2.5">{r.remittance_month?.slice(0, 7)}</td>
                      <td className="px-5 py-2.5 font-medium">{r.owner?.name ?? "—"}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">¥{Number(r.total_rent).toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right text-danger tabular-nums">-¥{Number(r.management_fee_deducted).toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right text-warning tabular-nums">
                        {Number(r.expense_deducted) > 0 ? `-¥${Number(r.expense_deducted).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right font-medium text-accent tabular-nums">¥{Number(r.net_amount).toLocaleString()}</td>
                      <td className="px-5 py-2.5"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-2.5">
                        <a
                          href={`/api/remittances/${r.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-accent hover:underline"
                        >
                          PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
