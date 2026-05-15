import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { getTenantDetail } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import TenantDetailClient from "@/components/TenantDetailClient";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getTenantDetail(id);
  if (!result) notFound();

  const { tenant, contracts } = result;
  const activeContract = contracts.find((c: any) => c.status === "active");

  return (
    <>
      <div className="mb-6">
        <Link
          href="/tenants"
          className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          入居者一覧に戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">{tenant.name}</h1>
            {tenant.name_kana && <p className="text-[13px] text-ink-3 mt-0.5">{tenant.name_kana}</p>}
          </div>
          <TenantDetailClient tenant={tenant} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 左カラム */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報カード */}
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">基本情報</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              <div>
                <span className="text-ink-3">氏名</span>
                <p className="font-medium">{tenant.name}</p>
              </div>
              {tenant.name_kana && (
                <div>
                  <span className="text-ink-3">フリガナ</span>
                  <p className="font-medium">{tenant.name_kana}</p>
                </div>
              )}
              {tenant.phone && (
                <div>
                  <span className="text-ink-3">電話番号</span>
                  <a href={`tel:${tenant.phone}`} className="flex items-center gap-1.5 text-accent hover:underline">
                    <Phone size={13} />
                    {tenant.phone}
                  </a>
                </div>
              )}
              {tenant.email && (
                <div>
                  <span className="text-ink-3">メール</span>
                  <a href={`mailto:${tenant.email}`} className="flex items-center gap-1.5 text-accent hover:underline">
                    <Mail size={13} />
                    {tenant.email}
                  </a>
                </div>
              )}
              {tenant.workplace && (
                <div>
                  <span className="text-ink-3">勤務先</span>
                  <p className="font-medium">{tenant.workplace}</p>
                </div>
              )}
              {tenant.emergency_contact && (
                <div>
                  <span className="text-ink-3">緊急連絡先</span>
                  <p className="font-medium">{tenant.emergency_contact}</p>
                </div>
              )}
              {tenant.emergency_phone && (
                <div>
                  <span className="text-ink-3">緊急連絡先電話</span>
                  <p className="font-medium">{tenant.emergency_phone}</p>
                </div>
              )}
            </div>
            {tenant.notes && (
              <div className="mt-4 pt-4 border-t border-line">
                <span className="text-[11px] text-ink-3">備考</span>
                <p className="text-[13px] mt-1 whitespace-pre-wrap">{tenant.notes}</p>
              </div>
            )}
          </div>

          {/* 契約履歴 */}
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">契約履歴</h2>
            {contracts.length === 0 ? (
              <p className="text-[13px] text-ink-3 text-center py-3">契約がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-ink-3 border-b border-line">
                      <th className="px-4 py-2 font-medium">物件・部屋</th>
                      <th className="px-4 py-2 font-medium">契約期間</th>
                      <th className="px-4 py-2 font-medium text-right">賃料</th>
                      <th className="px-4 py-2 font-medium">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c: any) => (
                      <tr key={c.id} className="border-b border-line last:border-0 hover:bg-bg-2/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link href={`/contracts/${c.id}`} className="text-accent hover:underline">
                            {c.unit?.property?.name} {c.unit?.unit_number}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">{c.start_date} 〜 {c.end_date || "—"}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">¥{Number(c.rent).toLocaleString()}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          {activeContract && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-4">現在の入居先</h2>
              <div className="space-y-3 text-[13px]">
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">物件</p>
                  <Link href={`/properties/${activeContract.unit?.property?.id}`} className="text-accent hover:underline">
                    {activeContract.unit?.property?.name || "—"}
                  </Link>
                </div>
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">部屋</p>
                  <p>{activeContract.unit?.unit_number || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">賃料</p>
                  <p className="font-semibold tabular-nums">¥{Number(activeContract.rent).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">契約満了</p>
                  <p>{activeContract.end_date || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
