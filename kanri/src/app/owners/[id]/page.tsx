import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { getOwnerDetail } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import OwnerDetailClient from "@/components/OwnerDetailClient";

export default async function OwnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getOwnerDetail(id);
  if (!result) notFound();

  const { owner, remittances } = result;
  const ownerProps = owner.properties || [];
  const ownerUnits = ownerProps.flatMap((p: any) => p.units || []);
  const occupiedUnits = ownerUnits.filter((u: any) => u.status === "occupied");
  const totalRent = occupiedUnits.reduce((s: number, u: any) => s + Number(u.rent), 0);

  return (
    <>
      <div className="mb-6">
        <Link
          href="/owners"
          className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          オーナー一覧に戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-accent-tint flex items-center justify-center text-accent text-[16px] font-semibold">
                {owner.name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-lg font-semibold">{owner.name}</h1>
                <p className="text-[13px] text-ink-3 mt-0.5">手数料率 {Number(owner.management_fee_rate)}%</p>
              </div>
            </div>
          </div>
          <OwnerDetailClient owner={owner} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* サマリー */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">物件数</p>
              <p className="text-lg font-semibold tabular-nums">{ownerProps.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">総戸数</p>
              <p className="text-lg font-semibold tabular-nums">{ownerUnits.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">入居</p>
              <p className="text-lg font-semibold text-accent-deep tabular-nums">{occupiedUnits.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">家賃収入</p>
              <p className="text-lg font-semibold tabular-nums">¥{totalRent.toLocaleString()}</p>
            </div>
          </div>

          {/* 所有物件 */}
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">所有物件</h2>
            {ownerProps.length === 0 ? (
              <p className="text-[13px] text-ink-3 text-center py-3">物件がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-ink-3 border-b border-line">
                      <th className="px-4 py-2 font-medium">物件名</th>
                      <th className="px-4 py-2 font-medium text-center">戸数</th>
                      <th className="px-4 py-2 font-medium text-center">入居</th>
                      <th className="px-4 py-2 font-medium text-right">家賃合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerProps.map((p: any) => {
                      const pUnits = p.units || [];
                      const pOccupied = pUnits.filter((u: any) => u.status === "occupied");
                      const pRent = pOccupied.reduce((s: number, u: any) => s + Number(u.rent), 0);
                      return (
                        <tr key={p.id} className="border-b border-line last:border-0 hover:bg-bg-2/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <Link href={`/properties/${p.id}`} className="text-accent hover:underline font-medium">
                              {p.name}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-center tabular-nums">{pUnits.length}</td>
                          <td className="px-4 py-2.5 text-center tabular-nums text-accent-deep">{pOccupied.length}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">¥{pRent.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 送金履歴 */}
          {remittances.length > 0 && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-4">送金履歴（直近12ヶ月）</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-ink-3 border-b border-line">
                      <th className="px-4 py-2 font-medium">対象月</th>
                      <th className="px-4 py-2 font-medium text-right">家賃収入</th>
                      <th className="px-4 py-2 font-medium text-right">手数料</th>
                      <th className="px-4 py-2 font-medium text-right">経費</th>
                      <th className="px-4 py-2 font-medium text-right">送金額</th>
                      <th className="px-4 py-2 font-medium">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remittances.map((r: any) => (
                      <tr key={r.id} className="border-b border-line last:border-0 hover:bg-bg-2/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link href={`/remittances/${r.id}`} className="text-accent hover:underline">
                            {r.remittance_month?.slice(0, 7)}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">¥{Number(r.total_rent).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-danger tabular-nums">-¥{Number(r.management_fee_deducted).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-warn tabular-nums">
                          {Number(r.expense_deducted) > 0 ? `-¥${Number(r.expense_deducted).toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-accent tabular-nums">¥{Number(r.net_amount).toLocaleString()}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">連絡先</h2>
            <div className="space-y-3">
              {owner.phone && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">電話番号</p>
                  <a href={`tel:${owner.phone}`} className="inline-flex items-center gap-1.5 text-[14px] text-accent hover:underline">
                    <Phone size={13} />
                    {owner.phone}
                  </a>
                </div>
              )}
              {owner.email && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">メール</p>
                  <a href={`mailto:${owner.email}`} className="inline-flex items-center gap-1.5 text-[14px] text-accent hover:underline">
                    <Mail size={13} />
                    {owner.email}
                  </a>
                </div>
              )}
              {owner.address && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">住所</p>
                  <p className="text-[13px]">{owner.address}</p>
                </div>
              )}
            </div>
          </div>

          {owner.bank_name && (
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
                {owner.account_number && (
                  <div>
                    <span className="text-ink-3">口座番号</span>
                    <p className="font-medium tabular-nums">{owner.account_number}</p>
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
