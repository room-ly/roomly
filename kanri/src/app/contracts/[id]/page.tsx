import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { getContractDetail, getUnitsForSelect, getTenantsForSelect } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import ContractDetailClient from "@/components/ContractDetailClient";

const contractTypeLabels: Record<string, string> = {
  fixed: "定期借家",
  ordinary: "普通借家",
};

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, units, tenants] = await Promise.all([
    getContractDetail(id),
    getUnitsForSelect(),
    getTenantsForSelect(),
  ]);
  if (!result) notFound();

  const { contract, billings } = result;
  const tenant = contract.tenant;
  const unit = contract.unit;
  const property = unit?.property;

  const remainingDays = contract.end_date
    ? Math.ceil((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          契約一覧に戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">
              {property?.name} {unit?.unit_number}
            </h1>
            <p className="text-[13px] text-ink-3 mt-0.5">
              {tenant?.name} — {contractTypeLabels[contract.contract_type] || contract.contract_type}契約
            </p>
          </div>
          <ContractDetailClient contract={contract} units={units} tenants={tenants} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 左カラム */}
        <div className="lg:col-span-2 space-y-6">
          {/* 契約情報カード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">契約種別</p>
              <StatusBadge status={contract.contract_type} />
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">契約期間</p>
              <p className="text-[14px] font-medium">{contract.start_date} 〜 {contract.end_date || "—"}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">賃料</p>
              <p className="text-[14px] font-semibold tabular-nums">¥{Number(contract.rent).toLocaleString()}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">管理費</p>
              <p className="text-[14px] font-semibold tabular-nums">¥{Number(contract.management_fee).toLocaleString()}</p>
            </div>
          </div>

          {/* 契約残期間 */}
          {remainingDays !== null && (
            <div className={`card p-4 border-l-[3px] ${remainingDays <= 0 ? "border-l-danger" : remainingDays <= 30 ? "border-l-danger" : remainingDays <= 90 ? "border-l-warn" : "border-l-accent"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">契約残日数</p>
                  <p className={`text-lg font-semibold ${remainingDays <= 0 ? "text-danger" : remainingDays <= 30 ? "text-danger" : remainingDays <= 90 ? "text-warn" : ""}`}>
                    {remainingDays <= 0 ? "期限切れ" : `あと${remainingDays}日`}
                  </p>
                </div>
                <p className="text-[13px] text-ink-3">満了日: {contract.end_date}</p>
              </div>
            </div>
          )}

          {/* 契約詳細 */}
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">契約詳細</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              {contract.deposit != null && Number(contract.deposit) > 0 && (
                <div>
                  <span className="text-ink-3">敷金</span>
                  <p className="font-medium tabular-nums">¥{Number(contract.deposit).toLocaleString()}</p>
                </div>
              )}
              {contract.key_money != null && Number(contract.key_money) > 0 && (
                <div>
                  <span className="text-ink-3">礼金</span>
                  <p className="font-medium tabular-nums">¥{Number(contract.key_money).toLocaleString()}</p>
                </div>
              )}
              {contract.renewal_fee != null && Number(contract.renewal_fee) > 0 && (
                <div>
                  <span className="text-ink-3">更新料</span>
                  <p className="font-medium tabular-nums">¥{Number(contract.renewal_fee).toLocaleString()}</p>
                </div>
              )}
              {contract.guarantor_name && (
                <div>
                  <span className="text-ink-3">保証人</span>
                  <p className="font-medium">{contract.guarantor_name}</p>
                </div>
              )}
              {contract.guarantor_phone && (
                <div>
                  <span className="text-ink-3">保証人連絡先</span>
                  <p className="font-medium">{contract.guarantor_phone}</p>
                </div>
              )}
              {contract.insurance_company && (
                <div>
                  <span className="text-ink-3">保険会社</span>
                  <p className="font-medium">{contract.insurance_company}</p>
                </div>
              )}
            </div>
            {contract.notes && (
              <div className="mt-4 pt-4 border-t border-line">
                <span className="text-[11px] text-ink-3">備考</span>
                <p className="text-[13px] mt-1 whitespace-pre-wrap">{contract.notes}</p>
              </div>
            )}
          </div>

          {/* 家賃請求履歴 */}
          {billings.length > 0 && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-4">家賃請求履歴（直近12ヶ月）</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-ink-3 border-b border-line">
                      <th className="px-4 py-2 font-medium">対象月</th>
                      <th className="px-4 py-2 font-medium text-right">請求額</th>
                      <th className="px-4 py-2 font-medium">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billings.map((b: any) => (
                      <tr key={b.id} className={`border-b border-line last:border-0 hover:bg-bg-2/30 transition-colors ${b.status === "overdue" ? "bg-danger-tint" : ""}`}>
                        <td className="px-4 py-2.5">
                          <Link href={`/rent/${b.id}`} className="text-accent hover:underline">
                            {b.billing_month}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">¥{Number(b.total_amount).toLocaleString()}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={b.status} /></td>
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
            <h2 className="text-[14px] font-semibold mb-4">入居者情報</h2>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">氏名</p>
                <p className="text-[14px] font-medium">{tenant?.name || "—"}</p>
                {tenant?.name_kana && <p className="text-[12px] text-ink-3">{tenant.name_kana}</p>}
              </div>
              {tenant?.phone && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">電話番号</p>
                  <a href={`tel:${tenant.phone}`} className="inline-flex items-center gap-1.5 text-[14px] text-accent hover:underline">
                    <Phone size={13} />
                    {tenant.phone}
                  </a>
                </div>
              )}
              {tenant?.email && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">メール</p>
                  <a href={`mailto:${tenant.email}`} className="inline-flex items-center gap-1.5 text-[14px] text-accent hover:underline">
                    <Mail size={13} />
                    {tenant.email}
                  </a>
                </div>
              )}
              {tenant?.workplace && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">勤務先</p>
                  <p className="text-[13px]">{tenant.workplace}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">物件情報</h2>
            <div className="space-y-3 text-[13px]">
              <div>
                <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">物件</p>
                <Link href={`/properties/${property?.id}`} className="text-accent hover:underline">
                  {property?.name || "—"}
                </Link>
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
              {unit?.layout && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">間取り</p>
                  <p>{unit.layout}</p>
                </div>
              )}
              {unit?.floor_area_sqm && (
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">面積</p>
                  <p>{unit.floor_area_sqm}㎡</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
