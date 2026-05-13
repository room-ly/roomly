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
  const billing = await getRentBillingDetail(id);
  if (!billing) notFound();

  const tenant = billing.contract?.tenant;
  const unit = billing.contract?.unit;
  const property = unit?.property;
  const payments = billing.rent_payments || [];
  const paidTotal = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const remaining = Number(billing.total_amount) - paidTotal;

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
              {billing.billing_month} の家賃請求
            </h1>
            <p className="text-[13px] text-ink-3 mt-0.5">
              {property?.name} {unit?.unit_number}
            </p>
          </div>
          <StatusBadge status={billing.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左カラム: 請求情報 + 入金履歴 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 請求内訳 */}
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">請求内訳</h2>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-ink-3">賃料</span>
                <span className="tabular-nums">¥{Number(billing.rent).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">管理費</span>
                <span className="tabular-nums">¥{Number(billing.management_fee).toLocaleString()}</span>
              </div>
              {Number(billing.other_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-3">{billing.other_description || "その他"}</span>
                  <span className="tabular-nums">¥{Number(billing.other_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-line font-medium">
                <span>請求合計</span>
                <span className="tabular-nums">¥{Number(billing.total_amount).toLocaleString()}</span>
              </div>
            </div>

            {/* 入金状況バー */}
            <div className="mt-4">
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-ink-3">入金済 ¥{paidTotal.toLocaleString()}</span>
                <span className={`font-medium ${remaining > 0 ? "text-warn" : "text-accent-deep"}`}>
                  {remaining > 0 ? `残 ¥${remaining.toLocaleString()}` : "完済"}
                </span>
              </div>
              <div className="h-2 bg-bg-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${remaining > 0 ? "bg-warn" : "bg-accent-deep"}`}
                  style={{ width: `${Math.min(100, (paidTotal / Number(billing.total_amount)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 入金履歴 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold">入金履歴</h2>
              {billing.status !== "paid" && (
                <RentDetailClient billing={{
                  id: billing.id,
                  total_amount: Number(billing.total_amount),
                  paid_amount: paidTotal,
                  tenant_name: tenant?.name || "—",
                  unit_label: `${property?.name || ""} ${unit?.unit_number || ""}`,
                  billing_month: billing.billing_month,
                }} />
              )}
            </div>
            {payments.length === 0 ? (
              <p className="text-[13px] text-ink-3 py-4 text-center">入金記録はありません</p>
            ) : (
              <div className="overflow-x-auto">
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
                    {payments
                      .sort((a: any, b: any) => a.payment_date > b.payment_date ? -1 : 1)
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
              </div>
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
            <h2 className="text-[14px] font-semibold mb-4">請求情報</h2>
            <div className="space-y-3 text-[13px]">
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">物件</p>
                <p>{property?.name || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">部屋</p>
                <p>{unit?.unit_number || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">対象月</p>
                <p>{billing.billing_month}</p>
              </div>
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">支払期限</p>
                <p>{billing.due_date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
