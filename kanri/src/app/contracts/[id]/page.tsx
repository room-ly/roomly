import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getContractDetail, getUnitsForSelect, getTenantsForSelect } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import ContractDetailClient from "@/components/ContractDetailClient";
import MoveOutReviewClient from "@/components/MoveOutReviewClient";

const contractTypeLabels: Record<string, string> = {
  fixed: "定期借家",
  ordinary: "普通借家",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-line text-[13px]">
      <span className="text-ink-3 shrink-0 w-[120px]">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function RefLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-accent underline underline-offset-2 decoration-accent/40 hover:decoration-accent transition-colors">
      {children}
      <ExternalLink size={11} className="opacity-50" />
    </Link>
  );
}

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

  const { contract, billings, moveOutRequests } = result;
  const tenant = contract.tenant;
  const unit = contract.unit;
  const property = unit?.property;

  const remainingDays = contract.end_date
    ? Math.ceil((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href="/contracts"
          className="inline-flex items-center gap-1 text-[12px] text-ink-4 hover:text-ink-2 mb-4 transition-colors"
        >
          <ArrowLeft size={12} />
          契約一覧
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <StatusBadge status={contract.status} />
              <StatusBadge status={contract.contract_type} />
              {remainingDays !== null && remainingDays <= 90 && (
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  remainingDays <= 30 ? "bg-danger-tint text-danger" : "bg-warn-tint text-warn"
                }`}>
                  {remainingDays <= 0 ? "期限切れ" : `あと${remainingDays}日`}
                </span>
              )}
            </div>
            <h1 className="text-[20px] font-semibold tracking-tight leading-tight">
              {property?.name} {unit?.unit_number}
            </h1>
            <p className="text-[13px] text-ink-3 mt-0.5">{contract.start_date} 〜 {contract.end_date || "期限なし"}</p>
          </div>
          <ContractDetailClient contract={contract} units={units} tenants={tenants} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* メインカラム */}
        <div className="space-y-8">
          {/* 賃料 */}
          <section>
            <h2 className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.08em] mb-3">賃料・費用</h2>
            <div className="border-t border-line">
              <Field label="賃料"><span className="font-semibold tabular-nums">¥{Number(contract.rent).toLocaleString()}</span></Field>
              <Field label="管理費"><span className="tabular-nums">¥{Number(contract.management_fee).toLocaleString()}</span></Field>
              <Field label="月額合計"><span className="font-semibold tabular-nums">¥{(Number(contract.rent) + Number(contract.management_fee)).toLocaleString()}</span></Field>
              {Number(contract.deposit) > 0 && (
                <Field label="敷金"><span className="tabular-nums">¥{Number(contract.deposit).toLocaleString()}</span></Field>
              )}
              {Number(contract.key_money) > 0 && (
                <Field label="礼金"><span className="tabular-nums">¥{Number(contract.key_money).toLocaleString()}</span></Field>
              )}
              {Number(contract.renewal_fee) > 0 && (
                <Field label="更新料"><span className="tabular-nums">¥{Number(contract.renewal_fee).toLocaleString()}</span></Field>
              )}
            </div>
          </section>

          {/* 契約条件 */}
          <section>
            <h2 className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.08em] mb-3">契約条件</h2>
            <div className="border-t border-line">
              <Field label="契約種別">{contractTypeLabels[contract.contract_type] || contract.contract_type}</Field>
              <Field label="契約期間">{contract.start_date} 〜 {contract.end_date || "期限なし"}</Field>
              {contract.guarantor_name && (
                <Field label="保証人">
                  {contract.guarantor_name}
                  {contract.guarantor_phone && <span className="text-ink-3 ml-2 text-[12px]">{contract.guarantor_phone}</span>}
                </Field>
              )}
              {contract.insurance_company && (
                <Field label="保険会社">{contract.insurance_company}</Field>
              )}
            </div>
            {contract.notes && (
              <p className="text-[13px] text-ink-2 mt-3 whitespace-pre-wrap">{contract.notes}</p>
            )}
          </section>

          {/* 家賃請求履歴 */}
          {billings.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.08em] mb-3">請求履歴（直近12ヶ月）</h2>
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
                        <td><Link href={href} className="tabular-nums text-right">¥{Number(b.total_amount).toLocaleString()}</Link></td>
                        <td><Link href={href}><StatusBadge status={b.status} /></Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          {/* 退去申請 */}
          {moveOutRequests.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.08em] mb-3">退去申請</h2>
              <div className="space-y-3">
                {moveOutRequests.map((req: any) => (
                  <div key={req.id} className={`border rounded-lg p-4 ${req.status === "pending" ? "border-warn border-2" : "border-line"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {req.status === "pending" && (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-warn-tint text-warn">未処理</span>
                        )}
                        <span className="text-[13px] font-medium">退去希望日: {req.desired_move_out_date}</span>
                      </div>
                      <span className="text-[12px] text-ink-3">申請日: {req.created_at?.slice(0, 10)}</span>
                    </div>

                    {req.reason && (
                      <div className="text-[13px] mb-2">
                        <span className="text-ink-3">理由: </span>
                        <span>{req.reason}</span>
                      </div>
                    )}

                    {(req.forwarding_address || req.forwarding_phone) && (
                      <div className="text-[13px] mb-2">
                        <span className="text-ink-3">転居先: </span>
                        {req.forwarding_postal_code && <span>〒{req.forwarding_postal_code} </span>}
                        {req.forwarding_address && <span>{req.forwarding_address} </span>}
                        {req.forwarding_phone && <span>TEL: {req.forwarding_phone}</span>}
                      </div>
                    )}

                    {req.bank_name && (
                      <div className="text-[13px] mb-2">
                        <span className="text-ink-3">敷金返還先: </span>
                        <span>{req.bank_name} {req.bank_branch} {req.bank_account_type} {req.bank_account_number}（{req.bank_account_holder}）</span>
                      </div>
                    )}

                    {req.review_notes && req.status !== "pending" && (
                      <div className="text-[13px] mb-2">
                        <span className="text-ink-3">備考: </span>
                        <span>{req.review_notes}</span>
                      </div>
                    )}

                    <MoveOutReviewClient request={req} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* サイドバー */}
        <div className="space-y-8">
          {/* 入居者 */}
          <section>
            <h2 className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.08em] mb-3">入居者</h2>
            <div className="border-t border-line">
              <div className="py-3 border-b border-line">
                <RefLink href={`/tenants/${tenant?.id}`}>{tenant?.name || "—"}</RefLink>
                {tenant?.name_kana && <span className="text-ink-4 ml-2 text-[12px]">{tenant.name_kana}</span>}
              </div>
              {tenant?.phone && (
                <div className="flex items-baseline justify-between py-2 border-b border-line text-[13px]">
                  <span className="text-ink-3">電話</span>
                  <a href={`tel:${tenant.phone}`} className="text-accent underline underline-offset-2 decoration-accent/40 hover:decoration-accent">{tenant.phone}</a>
                </div>
              )}
              {tenant?.email && (
                <div className="flex items-baseline justify-between py-2 border-b border-line text-[13px]">
                  <span className="text-ink-3">メール</span>
                  <a href={`mailto:${tenant.email}`} className="text-accent underline underline-offset-2 decoration-accent/40 hover:decoration-accent text-[12px]">{tenant.email}</a>
                </div>
              )}
              {tenant?.workplace && (
                <div className="flex items-baseline justify-between py-2 border-b border-line text-[13px]">
                  <span className="text-ink-3">勤務先</span>
                  <span>{tenant.workplace}</span>
                </div>
              )}
            </div>
          </section>

          {/* 物件 */}
          <section>
            <h2 className="text-[11px] font-semibold text-ink-4 uppercase tracking-[0.08em] mb-3">物件</h2>
            <div className="border-t border-line">
              <div className="py-3 border-b border-line">
                <RefLink href={`/properties/${property?.id}`}>{property?.name || "—"}</RefLink>
                <span className="text-ink-2 ml-2">{unit?.unit_number}</span>
              </div>
              {property?.address && (
                <div className="flex items-baseline justify-between py-2 border-b border-line text-[13px]">
                  <span className="text-ink-3">住所</span>
                  <span className="text-ink-2">{property.address}</span>
                </div>
              )}
              {unit?.layout && (
                <div className="flex items-baseline justify-between py-2 border-b border-line text-[13px]">
                  <span className="text-ink-3">間取り</span>
                  <span>{unit.layout}</span>
                </div>
              )}
              {unit?.area_sqm && (
                <div className="flex items-baseline justify-between py-2 border-b border-line text-[13px]">
                  <span className="text-ink-3">面積</span>
                  <span>{unit.area_sqm}㎡</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
