import { getRentBillings } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import RentTable from "@/components/RentTable";

export default async function RentPage() {
  const billings = await getRentBillings();

  const totalExpected = billings.reduce((s: number, b: any) => s + Number(b.total_amount), 0);
  const totalPaid = billings
    .filter((b: any) => b.status === "paid")
    .reduce((s: number, b: any) => s + Number(b.total_amount), 0);
  const overdueCount = billings.filter((b: any) => b.status === "overdue").length;
  const overdueAmount = billings
    .filter((b: any) => b.status === "overdue")
    .reduce((s: number, b: any) => s + Number(b.total_amount), 0);
  const collectionRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

  return (
    <>
      <PageHeader title="家賃管理" description="家賃請求・入金状況" />

      {/* サマリー */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">請求総額</p>
          <p className="text-xl font-semibold tabular-nums">¥{totalExpected.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">入金済</p>
          <p className="text-xl font-semibold text-accent-deep tabular-nums">¥{totalPaid.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">回収率</p>
          <div className="flex items-end gap-2">
            <p className="text-xl font-semibold tabular-nums">{collectionRate}%</p>
            <div className="flex-1 h-1 bg-bg-2 rounded-full overflow-hidden mb-1.5">
              <div className="h-full rounded-full bg-accent" style={{ width: `${collectionRate}%` }} />
            </div>
          </div>
        </div>
        <div className="card p-4 border-l-[3px] border-l-danger">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">滞納</p>
          <p className="text-xl font-semibold text-danger tabular-nums">{overdueCount}件</p>
          <p className="text-[12px] text-danger mt-0.5 tabular-nums">¥{overdueAmount.toLocaleString()}</p>
        </div>
      </div>

      <RentTable data={billings} />
    </>
  );
}
