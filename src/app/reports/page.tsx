import { getDashboardData, getMonthlyTrend } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";

export default async function ReportsPage() {
  const [dashData, monthlyTrend] = await Promise.all([
    getDashboardData(),
    getMonthlyTrend(),
  ]);
  const { stats: s } = dashData;

  const totalExpenses = 0;
  const netIncome = s.total_rent_received - totalExpenses;

  return (
    <>
      <PageHeader
        title="レポート"
        description="収支・稼働状況の概要"
      />

      {/* サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
        <div className="card p-5">
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-3">家賃収入</p>
          <p className="text-[24px] font-semibold tracking-tight mt-2 tabular-nums">
            ¥{s.total_rent_received.toLocaleString()}
          </p>
          <p className="text-[12px] text-ink-3 mt-1">
            請求額 ¥{s.total_rent_expected.toLocaleString()}
          </p>
        </div>
        <div className="card p-5">
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-3">回収率</p>
          <p className="text-[24px] font-semibold tracking-tight mt-2 tabular-nums">
            {s.collection_rate}<span className="text-[14px] text-ink-3 ml-0.5">%</span>
          </p>
          <p className="text-[12px] text-ink-3 mt-1">
            滞納 {s.overdue_count}件 / ¥{s.overdue_amount.toLocaleString()}
          </p>
        </div>
        <div className="card p-5">
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-3">入居率</p>
          <p className="text-[24px] font-semibold tracking-tight mt-2 tabular-nums">
            {s.occupancy_rate}<span className="text-[14px] text-ink-3 ml-0.5">%</span>
          </p>
          <p className="text-[12px] text-ink-3 mt-1">
            {s.occupied_units}/{s.total_units}戸（空室 {s.vacant_units}戸）
          </p>
        </div>
        <div className="card p-5">
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-3">管理物件</p>
          <p className="text-[24px] font-semibold tracking-tight mt-2 tabular-nums">
            {s.total_properties}<span className="text-[14px] text-ink-3 ml-0.5">棟</span>
          </p>
          <p className="text-[12px] text-ink-3 mt-1">
            {s.total_units}区画
          </p>
        </div>
      </div>

      {/* 月次推移 */}
      {monthlyTrend.length > 0 && (
        <div className="card overflow-hidden mb-7">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line">
            <h2 className="text-[14px] font-semibold tracking-tight">家賃回収
              <span className="text-ink-3 text-[14px] font-normal ml-1.5" style={{ fontStyle: "italic" }}>月次推移</span>
            </h2>
            <span className="ml-auto badge badge-neutral font-mono">直近{monthlyTrend.length}ヶ月</span>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-3 h-[180px]">
              {monthlyTrend.map((m: Record<string, any>, i: number) => {
                const isLast = i === monthlyTrend.length - 1;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className={`font-mono text-[10px] tabular-nums ${isLast ? "text-ink font-semibold" : "text-ink-3"}`}>
                      {m.collectionRate}%
                    </span>
                    <div className="w-full bg-bg-2 rounded-t relative" style={{ height: "140px" }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t transition-all ${isLast ? "bg-ink" : "bg-accent"}`}
                        style={{ height: `${m.collectionRate}%` }}
                      />
                    </div>
                    <span className={`font-mono text-[10px] ${isLast ? "text-ink font-semibold" : "text-ink-3"}`}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 月次テーブル */}
          <div className="border-t border-line overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>月</th>
                  <th style={{ textAlign: "right" }}>請求額</th>
                  <th style={{ textAlign: "right" }}>回収額</th>
                  <th style={{ textAlign: "right" }}>回収率</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((m: Record<string, any>) => (
                  <tr key={m.month}>
                    <td className="font-mono text-[12px]">{m.month}</td>
                    <td className="num">¥{Number(m.totalAmount).toLocaleString()}</td>
                    <td className="num">¥{Number(m.paidAmount).toLocaleString()}</td>
                    <td className="num">{m.collectionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 稼働状況 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-[14px] font-semibold mb-4">運用状況</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-line">
              <span className="text-[13px] text-ink-2">未対応修繕</span>
              <span className="text-[13px] font-medium tabular-nums">{s.open_maintenance}件</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-line">
              <span className="text-[13px] text-ink-2">未対応問い合わせ</span>
              <span className="text-[13px] font-medium tabular-nums">{s.open_inquiries}件</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-ink-2">契約満了間近（3ヶ月以内）</span>
              <span className="text-[13px] font-medium tabular-nums">{s.expiring_contracts}件</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-[14px] font-semibold mb-4">収支サマリー</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-line">
              <span className="text-[13px] text-ink-2">家賃収入（回収済み）</span>
              <span className="text-[13px] font-medium tabular-nums">¥{s.total_rent_received.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-line">
              <span className="text-[13px] text-ink-2">滞納額</span>
              <span className="text-[13px] font-medium tabular-nums text-danger">¥{s.overdue_amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-ink-2">家賃請求合計</span>
              <span className="text-[13px] font-medium tabular-nums">¥{s.total_rent_expected.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
