import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { getRemittanceDetail, getOwnersForSelect, getDefaultCompanyBankAccount } from "@/lib/queries";
import { formatPhone } from "@/lib/phone";
import StatusBadge from "@/components/StatusBadge";
import RemittanceDetailClient from "@/components/RemittanceDetailClient";
import AuditLogSection from "@/components/AuditLogSection";

const paymentMethodLabel: Record<string, string> = {
  transfer: "振込",
  cash: "現金",
};

const accountTypeLabel: Record<string, string> = {
  savings: "貯蓄",
  checking: "当座",
  ordinary: "普通",
};

export default async function RemittanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, owners, companyBank] = await Promise.all([
    getRemittanceDetail(id),
    getOwnersForSelect(),
    getDefaultCompanyBankAccount(),
  ]);
  if (!result) notFound();

  const { remittance, items } = result;
  const owner = remittance.owner;
  const ownerBill = Number(remittance.carryover_to_next) || 0;

  return (
    <>
      <div className="detail-back">
        <Link href="/remittances" className="rlink is-muted is-back">← 送金管理に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">{owner?.name} — {remittance.remittance_month?.slice(0, 7)}</h1>
            <div className="detail-kana">送金明細</div>
          </div>
          <div style={{ marginLeft: 8 }}>
            <StatusBadge status={remittance.status} />
          </div>
        </div>
        <div className="detail-header-actions">
          <RemittanceDetailClient remittance={remittance} owners={owners} />
        </div>
      </div>

      {/* サマリー */}
      <div className="cols-summary" style={{ marginBottom: 24 }}>
        <div className="sum-card">
          <span className="sum-label mono">家賃収入</span>
          <span className="sum-value serif-i">¥{Number(remittance.total_rent).toLocaleString()}</span>
        </div>
        <div className="sum-card" style={{ borderLeft: "3px solid var(--danger)" }}>
          <span className="sum-label mono">管理手数料</span>
          <span className="sum-value serif-i" style={{ color: "var(--danger)" }}>-¥{Number(remittance.management_fee_deducted).toLocaleString()}</span>
        </div>
        <div className="sum-card" style={{ borderLeft: "3px solid var(--warn)" }}>
          <span className="sum-label mono">費用控除</span>
          <span className="sum-value serif-i" style={{ color: "var(--warn)" }}>
            {Number(remittance.expense_deducted) > 0 ? `-¥${Number(remittance.expense_deducted).toLocaleString()}` : "¥0"}
          </span>
        </div>
        <div className="sum-card sum-card-em">
          <span className="sum-label mono">送金額</span>
          <span className="sum-value serif-i">¥{Number(remittance.net_amount).toLocaleString()}</span>
        </div>
        {ownerBill > 0 && (
          <div className="sum-card" style={{ borderLeft: "3px solid var(--warn)" }}>
            <span className="sum-label mono">オーナー請求（不足分）</span>
            <span className="sum-value serif-i" style={{ color: "var(--warn)" }}>
              ¥{ownerBill.toLocaleString()}
            </span>
            <span className="sum-foot mono">費用が家賃収入を超過</span>
          </div>
        )}
      </div>

      {/* オーナーからの入金先（費用が家賃を超過し、オーナーへ請求する場合） */}
      {ownerBill > 0 && (
        <div className="section" style={{ marginBottom: 24, borderLeft: "3px solid var(--warn)" }}>
          <div className="section-head-bar">
            <h2>オーナーへの請求</h2>
            <span className="desc">不足分 ¥{ownerBill.toLocaleString()}</span>
          </div>
          <div className="section-body">
            <p style={{ fontSize: 13, marginBottom: 12 }}>
              当月は費用がオーナーの家賃収入を超過したため、不足分 ¥{ownerBill.toLocaleString()} をオーナーへ請求します。
              下記の口座へのご入金を依頼してください。
            </p>
            {companyBank ? (
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">入金先</div>
                  <div className="field-value">
                    {companyBank.bank_name} {companyBank.branch_name}{" "}
                    {accountTypeLabel[companyBank.account_type as string] || "普通"}{" "}
                    <span className="mono">{companyBank.account_number}</span>
                  </div>
                </div>
                <div className="field">
                  <div className="field-label mono">口座名義</div>
                  <div className="field-value">{companyBank.account_holder}</div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--warn)" }}>
                ※ 入金先口座が未登録です。設定で会社の振込先口座を登録してください。
              </p>
            )}
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-col-main">
          {/* 送金情報 */}
          <div className="section">
            <div className="section-head-bar"><h2>送金情報</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">対象月</div>
                  <div className="field-value field-plain mono">{remittance.remittance_month?.slice(0, 7)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">方法</div>
                  <div className="field-value field-plain">{paymentMethodLabel[remittance.payment_method] || "振込"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">状態</div>
                  <div className="field-value"><StatusBadge status={remittance.status} /></div>
                </div>
                {remittance.transfer_date && (
                  <div className="field">
                    <div className="field-label mono">振込日</div>
                    <div className="field-value field-plain mono">{remittance.transfer_date}</div>
                  </div>
                )}
                {remittance.manual_override && (
                  <div className="field">
                    <div className="field-label mono">手動調整</div>
                    <div className="field-value" style={{ color: "var(--warn)", fontWeight: 500 }}>あり</div>
                  </div>
                )}
              </div>
              {remittance.notes && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <span className="field-label mono">備考</span>
                  <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{remittance.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* 物件別明細 */}
          {items.length > 0 && (
            <div className="section">
              <div className="section-head-bar">
                <h2>物件別明細</h2>
                <span className="desc">{items.length}件</span>
              </div>
              <div className="section-body flush">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>物件</th>
                      <th>部屋</th>
                      <th style={{ textAlign: "right" }}>家賃</th>
                      <th style={{ textAlign: "right" }}>手数料</th>
                      <th style={{ textAlign: "right" }}>差引額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => (
                      <tr key={item.id}>
                        <td>{item.property?.name || "—"}</td>
                        <td className="mono">{item.unit?.unit_number || "—"}</td>
                        <td className="num">¥{Number(item.rent_amount || 0).toLocaleString()}</td>
                        <td className="num" style={{ color: "var(--danger)" }}>-¥{Number(item.fee_amount || 0).toLocaleString()}</td>
                        <td className="num" style={{ fontWeight: 500 }}>¥{Number(item.net_amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PDF */}
          <div style={{ marginTop: 16 }}>
            <a
              href={`/api/remittances/${remittance.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: 13 }}
            >
              PDF をダウンロード
            </a>
          </div>

          <AuditLogSection table="owner_remittances" recordId={remittance.id} recordLabel="送金" />
        </div>

        {/* サイドカラム */}
        <div className="detail-col-side">
          <div className="section">
            <div className="section-head-bar"><h2>オーナー情報</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">氏名</div>
                  <div className="field-value">
                    <Link href={`/owners/${owner?.id}`} className="rlink">{owner?.name || "—"}</Link>
                  </div>
                </div>
                {owner?.phone && (
                  <div className="field">
                    <div className="field-label mono">電話番号</div>
                    <div className="field-value">
                      <a href={`tel:${owner.phone}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Phone size={13} /> <span className="mono">{formatPhone(owner.phone)}</span>
                      </a>
                    </div>
                  </div>
                )}
                {owner?.email && (
                  <div className="field">
                    <div className="field-label mono">メール</div>
                    <div className="field-value">
                      <a href={`mailto:${owner.email}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Mail size={13} /> {owner.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {owner?.bank_name && (
            <div className="section">
              <div className="section-head-bar"><h2>振込先</h2></div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">銀行</div>
                    <div className="field-value field-plain">{owner.bank_name} {owner.bank_branch}</div>
                  </div>
                  {owner.bank_account_type && (
                    <div className="field">
                      <div className="field-label mono">種別</div>
                      <div className="field-value field-plain">{owner.bank_account_type === "ordinary" ? "普通" : owner.bank_account_type === "current" ? "当座" : owner.bank_account_type}</div>
                    </div>
                  )}
                  {owner.bank_account_holder && (
                    <div className="field">
                      <div className="field-label mono">名義</div>
                      <div className="field-value field-plain">{owner.bank_account_holder}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
