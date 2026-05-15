import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { getRentBillingDetail } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import RentDetailClient from "@/components/RentDetailClient";

const paymentMethodLabels: Record<string, string> = {
  transfer: "銀行振込",
  card: "クレジットカード",
  cash: "現金",
  debit: "口座引落",
};

export default async function RentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRentBillingDetail(id);
  if (!result) notFound();

  const { current, history } = "current" in result
    ? result
    : { current: result, history: [result] };

  const tenant = current.contract?.tenant;
  const unit = current.contract?.unit;
  const property = unit?.property;

  const currentPayments = current.rent_payments || [];
  const currentPaidTotal = currentPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const currentRemaining = Number(current.total_amount) - currentPaidTotal;

  const totalBilled = history.reduce((s: number, b: any) => s + Number(b.total_amount), 0);
  const totalPaid = history.reduce((s: number, b: any) => {
    const payments = b.rent_payments || [];
    return s + payments.reduce((ps: number, p: any) => ps + Number(p.amount), 0);
  }, 0);

  return (
    <>
      <div className="mb-6">
        <Link
          href="/rent"
          className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          家賃管理に戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">
              {property?.name} {unit?.unit_number}
            </h1>
            <p className="text-[13px] text-ink-3 mt-0.5">
              {tenant?.name} — 家賃履歴
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 左カラム */}
        <div className="lg:col-span-2 space-y-6">

          {/* サマリーカード */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">請求累計</p>
              <p className="text-lg font-semibold tabular-nums">¥{totalBilled.toLocaleString()}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">入金累計</p>
              <p className="text-lg font-semibold text-accent-deep tabular-nums">¥{totalPaid.toLocaleString()}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">請求回数</p>
              <p className="text-lg font-semibold tabular-nums">{history.length}ヶ月</p>
            </div>
          </div>

          {/* 月別家賃履歴テーブル */}
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">月別家賃履歴</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-ink-3 border-b border-line">
                    <th className="px-4 py-2 font-medium">対象月</th>
                    <th className="px-4 py-2 font-medium text-right">請求額</th>
                    <th className="px-4 py-2 font-medium text-right">入金額</th>
                    <th className="px-4 py-2 font-medium">支払期限</th>
                    <th className="px-4 py-2 font-medium">状態</th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((b: any) => {
                    const payments = b.rent_payments || [];
                    const paid = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
                    const isCurrent = b.id === id;
                    return (
                      <tr
                        key={b.id}
                        className={`border-b border-line last:border-0 transition-colors ${
                          isCurrent ? "bg-accent/5" : "hover:bg-bg-2/30"
                        } ${b.status === "overdue" ? "bg-danger-tint" : ""}`}
                      >
                        <td className="px-4 py-2.5">
                          <span className={isCurrent ? "font-semibold" : ""}>{b.billing_month}</span>
                          {isCurrent && <span className="ml-1.5 text-[10px] text-accent font-medium">●</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">¥{Number(b.total_amount).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          <span className={paid > 0 ? "text-accent-deep font-medium" : "text-ink-3"}>
                            ¥{paid.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">{b.due_date}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={b.status} /></td>
                        <td className="px-4 py-2.5">
                          {b.status !== "paid" && (
                            <Link
                              href={`/rent/${b.id}`}
                              className="text-[11px] text-accent hover:underline"
                            >
                              詳細
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 選択月の請求内訳 + 入金履歴 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold">{current.billing_month} の詳細</h2>
              <StatusBadge status={current.status} />
            </div>

            <div className="space-y-2 text-[13px] mb-4">
              <div className="flex justify-between">
                <span className="text-ink-3">賃料</span>
                <span className="tabular-nums">¥{Number(current.rent).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">管理費</span>
                <span className="tabular-nums">¥{Number(current.management_fee).toLocaleString()}</span>
              </div>
              {Number(current.other_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-3">{current.other_description || "その他"}</span>
                  <span className="tabular-nums">¥{Number(current.other_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-line font-medium">
                <span>請求合計</span>
                <span className="tabular-nums">¥{Number(current.total_amount).toLocaleString()}</span>
              </div>
            </div>

            {/* 入金状況バー */}
            <div className="mb-5">
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-ink-3">入金済 ¥{currentPaidTotal.toLocaleString()}</span>
                <span className={`font-medium ${currentRemaining > 0 ? "text-warn" : "text-accent-deep"}`}>
                  {currentRemaining > 0 ? `残 ¥${currentRemaining.toLocaleString()}` : "完済"}
                </span>
              </div>
              <div className="h-2 bg-bg-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${currentRemaining > 0 ? "bg-warn" : "bg-accent-deep"}`}
                  style={{ width: `${Math.min(100, (currentPaidTotal / Number(current.total_amount)) * 100)}%` }}
                />
              </div>
            </div>

            {/* 入金履歴 */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-medium text-ink-2">入金履歴</h3>
              {current.status !== "paid" && (
                <RentDetailClient billing={{
                  id: current.id,
                  total_amount: Number(current.total_amount),
                  paid_amount: currentPaidTotal,
                  tenant_name: tenant?.name || "—",
                  unit_label: `${property?.name || ""} ${unit?.unit_number || ""}`,
                  billing_month: current.billing_month,
                }} />
              )}
            </div>
            {currentPayments.length === 0 ? (
              <p className="text-[13px] text-ink-3 py-3 text-center">入金記録はありません</p>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-ink-3 border-b border-line">
                    <th className="px-4 py-2 font-medium">入金日</th>
                    <th className="px-4 py-2 font-medium">方法</th>
                    <th className="px-4 py-2 font-medium text-right">金額</th>
                    <th className="px-4 py-2 font-medium">備考</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPayments
                    .sort((a: any, b: any) => (a.payment_date > b.payment_date ? -1 : 1))
                    .map((p: any) => (
                    <tr key={p.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5">{p.payment_date}</td>
                      <td className="px-4 py-2.5">{paymentMethodLabels[p.payment_method] || p.payment_method}</td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">¥{Number(p.amount).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-ink-3">{p.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 右カラム: 入居者情報 */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">入居者情報</h2>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">氏名</p>
                <p className="text-[14px] font-medium">{tenant?.name || "—"}</p>
              </div>
              {tenant?.phone && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">電話番号</p>
                  <a
                    href={`tel:${tenant.phone}`}
                    className="inline-flex items-center gap-1.5 text-[14px] text-accent hover:underline"
                  >
                    <Phone size={13} />
                    {tenant.phone}
                  </a>
                </div>
              )}
              {tenant?.email && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">メール</p>
                  <a
                    href={`mailto:${tenant.email}`}
                    className="inline-flex items-center gap-1.5 text-[14px] text-accent hover:underline"
                  >
                    <Mail size={13} />
                    {tenant.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">物件情報</h2>
            <div className="space-y-3 text-[13px]">
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">物件</p>
                <p>{property?.name || "—"}</p>
              </div>
              {property?.address && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">住所</p>
                  <p className="text-ink-2">{property.address}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">部屋</p>
                <p>{unit?.unit_number || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
