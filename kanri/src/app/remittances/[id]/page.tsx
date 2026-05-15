import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { getRemittanceDetail, getOwnersForSelect } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import RemittanceDetailClient from "@/components/RemittanceDetailClient";

const paymentMethodLabel: Record<string, string> = {
  transfer: "振込",
  cash: "現金",
};

export default async function RemittanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, owners] = await Promise.all([
    getRemittanceDetail(id),
    getOwnersForSelect(),
  ]);
  if (!result) notFound();

  const { remittance, items } = result;
  const owner = remittance.owner;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/remittances"
          className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          送金管理に戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">
              {owner?.name} — {remittance.remittance_month?.slice(0, 7)}
            </h1>
            <p className="text-[13px] text-ink-3 mt-0.5">送金明細</p>
          </div>
          <RemittanceDetailClient remittance={remittance} owners={owners} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* サマリー */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">家賃収入</p>
              <p className="text-lg font-semibold tabular-nums">¥{Number(remittance.total_rent).toLocaleString()}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">管理手数料</p>
              <p className="text-lg font-semibold text-danger tabular-nums">-¥{Number(remittance.management_fee_deducted).toLocaleString()}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">経費控除</p>
              <p className="text-lg font-semibold text-warn tabular-nums">
                {Number(remittance.expense_deducted) > 0 ? `-¥${Number(remittance.expense_deducted).toLocaleString()}` : "¥0"}
              </p>
            </div>
            <div className="card p-4 border-l-[3px] border-l-accent">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">送金額</p>
              <p className="text-lg font-semibold text-accent tabular-nums">¥{Number(remittance.net_amount).toLocaleString()}</p>
            </div>
          </div>

          {/* 送金詳細 */}
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">送金情報</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              <div>
                <span className="text-ink-3">対象月</span>
                <p className="font-medium">{remittance.remittance_month?.slice(0, 7)}</p>
              </div>
              <div>
                <span className="text-ink-3">方法</span>
                <p className="font-medium">{paymentMethodLabel[remittance.payment_method] || "振込"}</p>
              </div>
              <div>
                <span className="text-ink-3">状態</span>
                <StatusBadge status={remittance.status} />
              </div>
              {remittance.transfer_date && (
                <div>
                  <span className="text-ink-3">振込日</span>
                  <p className="font-medium">{remittance.transfer_date}</p>
                </div>
              )}
              {remittance.manual_override && (
                <div>
                  <span className="text-ink-3">手動調整</span>
                  <p className="font-medium text-warn">あり</p>
                </div>
              )}
            </div>
            {remittance.notes && (
              <div className="mt-4 pt-4 border-t border-line">
                <span className="text-[11px] text-ink-3">備考</span>
                <p className="text-[13px] mt-1 whitespace-pre-wrap">{remittance.notes}</p>
              </div>
            )}
          </div>

          {/* 明細 */}
          {items.length > 0 && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-4">物件別明細</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-ink-3 border-b border-line">
                      <th className="px-4 py-2 font-medium">物件</th>
                      <th className="px-4 py-2 font-medium">部屋</th>
                      <th className="px-4 py-2 font-medium text-right">家賃</th>
                      <th className="px-4 py-2 font-medium text-right">手数料</th>
                      <th className="px-4 py-2 font-medium text-right">差引額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => (
                      <tr key={item.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-2.5">{item.property?.name || "—"}</td>
                        <td className="px-4 py-2.5">{item.unit?.unit_number || "—"}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">¥{Number(item.rent_amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-danger tabular-nums">-¥{Number(item.fee_amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">¥{Number(item.net_amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PDF */}
          <div className="flex gap-2">
            <a
              href={`/api/remittances/${remittance.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-[13px]"
            >
              PDF をダウンロード
            </a>
          </div>
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">オーナー情報</h2>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">氏名</p>
                <Link href={`/owners/${owner?.id}`} className="text-[14px] font-medium text-accent hover:underline">
                  {owner?.name || "—"}
                </Link>
              </div>
              {owner?.phone && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">電話番号</p>
                  <a href={`tel:${owner.phone}`} className="inline-flex items-center gap-1.5 text-[14px] text-accent hover:underline">
                    <Phone size={13} />
                    {owner.phone}
                  </a>
                </div>
              )}
              {owner?.email && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">メール</p>
                  <a href={`mailto:${owner.email}`} className="inline-flex items-center gap-1.5 text-[14px] text-accent hover:underline">
                    <Mail size={13} />
                    {owner.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {owner?.bank_name && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-4">振込先</h2>
              <div className="space-y-2 text-[13px]">
                <div>
                  <span className="text-ink-3">銀行</span>
                  <p className="font-medium">{owner.bank_name} {owner.bank_branch}</p>
                </div>
                {owner.account_type && (
                  <div>
                    <span className="text-ink-3">種別</span>
                    <p className="font-medium">{owner.account_type === "ordinary" ? "普通" : owner.account_type === "current" ? "当座" : owner.account_type}</p>
                  </div>
                )}
                {owner.account_holder && (
                  <div>
                    <span className="text-ink-3">名義</span>
                    <p className="font-medium">{owner.account_holder}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
