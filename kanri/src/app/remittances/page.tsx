import { Fragment } from "react";
import { getOwners, getExpenses, getRemittances } from "@/lib/queries";
import { calcPropertyManagementFee } from "@/lib/remittance-calc";
import RemittancesPageClient from "@/components/RemittancesPageClient";

export default async function RemittancesPage() {
  const [owners, expensesResult, remittances] = await Promise.all([
    getOwners(),
    getExpenses(1, 10000),
    getRemittances(),
  ]);
  const expenses = expensesResult.data;

  // 承認済み(approved/ordered/completed/paid) の owner_amount のみ送金から控除
  const APPROVED_STATUSES = new Set(["approved", "ordered", "completed", "paid"]);
  const eligibleExpenses = expenses.filter(
    (e: any) => APPROVED_STATUSES.has(e.status) && Number(e.owner_amount) > 0,
  );

  const ownerExpenses = eligibleExpenses
    .filter((e: any) => e.owner_id)
    .reduce((acc: Record<string, number>, e: any) => {
      acc[e.owner_id] = (acc[e.owner_id] || 0) + Number(e.owner_amount);
      return acc;
    }, {} as Record<string, number>);

  const propertyExpenses = eligibleExpenses.reduce((acc: Record<string, number>, e: any) => {
    if (e.property_id) {
      acc[e.property_id] = (acc[e.property_id] || 0) + Number(e.owner_amount);
    }
    return acc;
  }, {} as Record<string, number>);

  const ownersWithBreakdown = owners.map((o: Record<string, any>) => {
    const ownerProps = o.properties || [];

    const propertyBreakdown = ownerProps.map((p: any) => {
      const pUnits = (p.units || []).filter((u: any) => u.status === "occupied");
      const pRent = pUnits.reduce((s: number, u: any) => s + Number(u.rent), 0);
      const pFee = calcPropertyManagementFee({
        rent: pRent,
        feeType: p.management_fee_type,
        feeRate: p.management_fee_rate,
        feeAmount: p.management_fee_amount,
        managementForm: p.management_form,
      });
      // 一覧表示用ラベル: 率なら「5%」、固定なら「固定」、自主管理なら空
      const feeLabel = p.management_form === "self"
        ? ""
        : p.management_fee_type === "fixed"
          ? "固定"
          : `${Number(p.management_fee_rate) || 0}%`;
      const pExpense = propertyExpenses[p.id] || 0;
      return {
        propertyId: p.id,
        propertyName: p.name,
        feeLabel,
        unitCount: (p.units || []).length,
        occupiedCount: pUnits.length,
        rent: pRent,
        fee: pFee,
        expense: pExpense,
        net: pRent - pFee - pExpense,
      };
    });

    const totalRent = propertyBreakdown.reduce((s: number, p: any) => s + p.rent, 0);
    const managementFee = propertyBreakdown.reduce((s: number, p: any) => s + p.fee, 0);
    const expenseDeducted = ownerExpenses[o.id] || 0;

    return {
      ...o,
      totalRent,
      managementFee,
      expenseDeducted,
      netAmount: totalRent - managementFee - expenseDeducted,
      propertyBreakdown,
    };
  });

  // 送金額合計は実際に送る金額（マイナスはゼロに丸める）。不足分はオーナーへ請求
  const totalNet = ownersWithBreakdown.reduce((s: number, o: any) => s + Math.max(0, o.netAmount), 0);
  const totalShortfall = ownersWithBreakdown.reduce((s: number, o: any) => s + Math.max(0, -o.netAmount), 0);
  const totalRent = ownersWithBreakdown.reduce((s: number, o: any) => s + o.totalRent, 0);
  const totalFee = ownersWithBreakdown.reduce((s: number, o: any) => s + o.managementFee, 0);

  return (
    <>
      <RemittancesPageClient
        owners={owners.map((o: Record<string, any>) => ({ id: o.id, name: o.name }))}
        remittances={remittances}
        ownerSummaries={ownersWithBreakdown.map((o: Record<string, any>) => ({
          id: o.id,
          name: o.name,
          netAmount: o.netAmount,
        }))}
      />

      {/* サマリー */}
      <div className="cols-summary">
        <div className="sum-card">
          <span className="sum-label mono">家賃収入合計</span>
          <span className="sum-value serif-i">¥{totalRent.toLocaleString()}</span>
          <span className="sum-foot mono">{owners.length}名のオーナー</span>
        </div>
        <div className="sum-card" style={{ borderLeft: "3px solid var(--danger)" }}>
          <span className="sum-label mono">管理手数料合計</span>
          <span className="sum-value serif-i" style={{ color: "var(--danger)" }}>-¥{totalFee.toLocaleString()}</span>
          <span className="sum-foot mono">収入から控除</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">費用控除</span>
          <span className="sum-value serif-i" style={{ color: "var(--warn)" }}>
            -¥{Object.values(ownerExpenses).reduce((s: number, v) => s + (v as number), 0).toLocaleString()}
          </span>
          <span className="sum-foot mono">オーナー負担分</span>
        </div>
        <div className="sum-card sum-card-em">
          <span className="sum-label mono">送金額合計</span>
          <span className="sum-value serif-i" style={{ color: "var(--accent-deep)" }}>¥{totalNet.toLocaleString()}</span>
          <span className="sum-foot mono">
            {owners.length}名に送金
            {totalShortfall > 0 && (
              <span style={{ color: "var(--warn)", marginLeft: 6 }}>
                ／オーナー請求 ¥{totalShortfall.toLocaleString()}（不足分）
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 物件別内訳テーブル */}
      <div className="section">
        <div className="section-head-bar">
          <h2>月次送金明細</h2>
          <span className="desc">物件別内訳</span>
        </div>
        <div className="section-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>オーナー</th>
                <th>物件</th>
                <th style={{ textAlign: "center" }}>入居/総戸</th>
                <th style={{ textAlign: "right" }}>家賃収入</th>
                <th style={{ textAlign: "right" }}>管理手数料</th>
                <th style={{ textAlign: "right" }}>費用控除</th>
                <th style={{ textAlign: "right" }}>送金額</th>
              </tr>
            </thead>
            <tbody>
              {ownersWithBreakdown.map((o: Record<string, any>) => (
                <Fragment key={o.id}>
                  {o.propertyBreakdown.map((p: Record<string, any>, i: number) => (
                    <tr
                      key={`${o.id}-${p.propertyId}`}
                      className="row-hover"
                    >
                      {i === 0 && (
                        <td className="strong" rowSpan={o.propertyBreakdown.length + 1}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="tn-av" style={{ width: 24, height: 24, fontSize: 10, background: "var(--accent-tint)", color: "var(--accent-deep)" }}>
                              {o.name.charAt(0)}
                            </span>
                            <div>{o.name}</div>
                          </div>
                        </td>
                      )}
                      <td style={{ color: "var(--ink-2)" }}>
                        {p.propertyName}
                        {p.feeLabel && (
                          <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)", marginLeft: 6 }}>{p.feeLabel}</span>
                        )}
                      </td>
                      <td className="mono" style={{ textAlign: "center" }}>{p.occupiedCount}/{p.unitCount}</td>
                      <td className="num">¥{p.rent.toLocaleString()}</td>
                      <td className="num" style={{ color: "var(--danger)" }}>-¥{p.fee.toLocaleString()}</td>
                      <td className="num" style={{ color: "var(--warn)" }}>
                        {p.expense > 0 ? `-¥${p.expense.toLocaleString()}` : "—"}
                      </td>
                      <td
                        className="num strong"
                        style={p.net < 0 ? { color: "var(--warn)" } : undefined}
                        title={p.net < 0 ? "費用が家賃収入を超過。不足分はオーナーへ請求します" : undefined}
                      >
                        ¥{p.net.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr key={`${o.id}-total`} className="tbl-total">
                    <td className="mono" style={{ textAlign: "right", color: "var(--ink-3)", fontSize: 11 }} colSpan={2}>合計</td>
                    <td className="num">¥{o.totalRent.toLocaleString()}</td>
                    <td className="num" style={{ color: "var(--danger)" }}>-¥{o.managementFee.toLocaleString()}</td>
                    <td className="num" style={{ color: "var(--warn)" }}>
                      {o.expenseDeducted > 0 ? `-¥${o.expenseDeducted.toLocaleString()}` : "—"}
                    </td>
                    <td
                      className="num"
                      style={{ color: o.netAmount < 0 ? "var(--warn)" : "var(--accent-deep)", fontWeight: 600 }}
                      title={o.netAmount < 0 ? "費用が家賃収入を超過。不足分はオーナーへ請求します" : undefined}
                    >
                      ¥{o.netAmount.toLocaleString()}
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
