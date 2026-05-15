import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  const remainingColor = remainingDays === null ? "" : remainingDays <= 0 ? "text-danger" : remainingDays <= 30 ? "text-danger" : remainingDays <= 90 ? "text-warn" : "";

  return (
    <>
      <div className="mb-5">
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          契約一覧に戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">
              {tenant?.name}
            </h1>
            <StatusBadge status={contract.contract_type} />
            <StatusBadge status={contract.status} />
          </div>
          <ContractDetailClient contract={contract} units={units} tenants={tenants} />
        </div>
        <p className="text-[13px] text-ink-3 mt-1">
          {property?.name} {unit?.unit_number}
          {property?.address && <span className="ml-2 text-ink-4">({property.address})</span>}
        </p>
      </div>

      {remainingDays !== null && remainingDays <= 90 && (
        <div className={`text-[13px] px-4 py-2.5 mb-5 border-l-[3px] bg-bg-2 ${remainingDays <= 30 ? "border-l-danger" : "border-l-warn"}`}>
          <span className={`font-semibold ${remainingColor}`}>
            {remainingDays <= 0 ? "契約期限切れ" : `契約満了まであと${remainingDays}日`}
          </span>
          <span className="text-ink-3 ml-3">満了日: {contract.end_date}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* 契約情報テーブル */}
          <section>
            <h2 className="text-[13px] font-semibold text-ink-3 uppercase tracking-wider mb-2">契約情報</h2>
            <table className="w-full text-[13px] border-t border-line">
              <tbody>
                <tr className="border-b border-line">
                  <td className="py-2.5 pr-4 text-ink-3 w-[140px]">契約種別</td>
                  <td className="py-2.5 font-medium">{contractTypeLabels[contract.contract_type] || contract.contract_type}</td>
                </tr>
                <tr className="border-b border-line">
                  <td className="py-2.5 pr-4 text-ink-3">契約期間</td>
                  <td className="py-2.5 font-medium">{contract.start_date} 〜 {contract.end_date || "期限なし"}</td>
                </tr>
                <tr className="border-b border-line">
                  <td className="py-2.5 pr-4 text-ink-3">賃料</td>
                  <td className="py-2.5 font-semibold tabular-nums">¥{Number(contract.rent).toLocaleString()}</td>
                </tr>
                <tr className="border-b border-line">
                  <td className="py-2.5 pr-4 text-ink-3">管理費</td>
                  <td className="py-2.5 tabular-nums">¥{Number(contract.management_fee).toLocaleString()}</td>
                </tr>
                {Number(contract.deposit) > 0 && (
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 text-ink-3">敷金</td>
                    <td className="py-2.5 tabular-nums">¥{Number(contract.deposit).toLocaleString()}</td>
                  </tr>
                )}
                {Number(contract.key_money) > 0 && (
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 text-ink-3">礼金</td>
                    <td className="py-2.5 tabular-nums">¥{Number(contract.key_money).toLocaleString()}</td>
                  </tr>
                )}
                {Number(contract.renewal_fee) > 0 && (
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 text-ink-3">更新料</td>
                    <td className="py-2.5 tabular-nums">¥{Number(contract.renewal_fee).toLocaleString()}</td>
                  </tr>
                )}
                {contract.guarantor_name && (
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 text-ink-3">保証人</td>
                    <td className="py-2.5">{contract.guarantor_name}{contract.guarantor_phone && <span className="text-ink-3 ml-2">{contract.guarantor_phone}</span>}</td>
                  </tr>
                )}
                {contract.insurance_company && (
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 text-ink-3">保険会社</td>
                    <td className="py-2.5">{contract.insurance_company}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {contract.notes && (
              <div className="mt-3 text-[13px]">
                <span className="text-ink-3">備考:</span>
                <span className="ml-2 whitespace-pre-wrap">{contract.notes}</span>
              </div>
            )}
          </section>

          {/* 家賃請求履歴 */}
          {billings.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold text-ink-3 uppercase tracking-wider mb-2">家賃請求履歴（直近12ヶ月）</h2>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>対象月</th>
                    <th style={{ textAlign: "right" }}>請求額</th>
                    <th>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {billings.map((b: any) => {
                    const href = `/rent/${b.id}`;
                    return (
                      <tr key={b.id} className={`row-hover row-link ${b.status === "overdue" ? "bg-danger-tint" : ""}`}>
                        <td><Link href={href}>{b.billing_month}</Link></td>
                        <td><Link href={href} className="tabular-nums text-right">{`¥${Number(b.total_amount).toLocaleString()}`}</Link></td>
                        <td><Link href={href}><StatusBadge status={b.status} /></Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          <section>
            <h2 className="text-[13px] font-semibold text-ink-3 uppercase tracking-wider mb-2">入居者</h2>
            <table className="w-full text-[13px] border-t border-line">
              <tbody>
                <tr className="border-b border-line">
                  <td className="py-2.5 pr-4 text-ink-3 w-[80px]">氏名</td>
                  <td className="py-2.5">
                    <Link href={`/tenants/${tenant?.id}`} className="font-medium text-accent hover:underline">{tenant?.name || "—"}</Link>
                    {tenant?.name_kana && <span className="text-ink-4 ml-2 text-[12px]">{tenant.name_kana}</span>}
                  </td>
                </tr>
                {tenant?.phone && (
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 text-ink-3">電話</td>
                    <td className="py-2.5"><a href={`tel:${tenant.phone}`} className="text-accent hover:underline">{tenant.phone}</a></td>
                  </tr>
                )}
                {tenant?.email && (
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 text-ink-3">メール</td>
                    <td className="py-2.5"><a href={`mailto:${tenant.email}`} className="text-accent hover:underline">{tenant.email}</a></td>
                  </tr>
                )}
                {tenant?.workplace && (
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 text-ink-3">勤務先</td>
                    <td className="py-2.5">{tenant.workplace}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold text-ink-3 uppercase tracking-wider mb-2">物件</h2>
            <table className="w-full text-[13px] border-t border-line">
              <tbody>
                <tr className="border-b border-line">
                  <td className="py-2.5 pr-4 text-ink-3 w-[80px]">物件名</td>
                  <td className="py-2.5">
                    <Link href={`/properties/${property?.id}`} className="text-accent hover:underline">{property?.name || "—"}</Link>
                  </td>
                </tr>
                {property?.address && (
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 text-ink-3">住所</td>
                    <td className="py-2.5 text-ink-2">{property.address}</td>
                  </tr>
                )}
                <tr className="border-b border-line">
                  <td className="py-2.5 pr-4 text-ink-3">部屋</td>
                  <td className="py-2.5">{unit?.unit_number || "—"}</td>
                </tr>
                {unit?.layout && (
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 text-ink-3">間取り</td>
                    <td className="py-2.5">{unit.layout}</td>
                  </tr>
                )}
                {unit?.area_sqm && (
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 text-ink-3">面積</td>
                    <td className="py-2.5">{unit.area_sqm}㎡</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </>
  );
}
