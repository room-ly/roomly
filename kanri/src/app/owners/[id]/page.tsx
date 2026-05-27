import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Mail, Printer, Smartphone } from "lucide-react";
import { getOwnerDetail } from "@/lib/queries";
import { formatPhone } from "@/lib/phone";
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
      <div className="detail-back">
        <Link href="/owners" className="rlink is-muted is-back">← オーナー一覧に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <span className="tn-av" style={{
            width: 48, height: 48, fontSize: 18,
            background: "var(--accent-tint)", color: "var(--accent)",
          }}>
            {(owner.name || "?").charAt(0)}
          </span>
          <div>
            <h1 className="detail-title">{owner.name}</h1>
            <div className="detail-kana">{ownerProps.length}物件</div>
          </div>
        </div>
        <div className="detail-header-actions">
          <OwnerDetailClient owner={owner} />
        </div>
      </div>

      {/* サマリー */}
      <div className="cols-summary" style={{ marginBottom: 24 }}>
        <div className="sum-card">
          <span className="sum-label mono">物件数</span>
          <span className="sum-value serif-i">{ownerProps.length}</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">総戸数</span>
          <span className="sum-value serif-i">{ownerUnits.length}</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">入居</span>
          <span className="sum-value serif-i" style={{ color: "var(--accent-deep)" }}>{occupiedUnits.length}</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">家賃収入</span>
          <span className="sum-value serif-i">¥{totalRent.toLocaleString()}</span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          {/* 所有物件 */}
          <div className="section">
            <div className="section-head-bar">
              <h2>所有物件</h2>
              <span className="desc">{ownerProps.length}件</span>
            </div>
            <div className="section-body flush">
              {ownerProps.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "24px 0" }}>物件がありません</p>
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>物件名</th>
                      <th style={{ textAlign: "center" }}>戸数</th>
                      <th style={{ textAlign: "center" }}>入居</th>
                      <th style={{ textAlign: "right" }}>家賃合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerProps.map((p: any) => {
                      const pUnits = p.units || [];
                      const pOccupied = pUnits.filter((u: any) => u.status === "occupied");
                      const pRent = pOccupied.reduce((s: number, u: any) => s + Number(u.rent), 0);
                      return (
                        <tr key={p.id} className="row-hover">
                          <td>
                            <Link href={`/properties/${p.id}`} className="rlink">{p.name}</Link>
                          </td>
                          <td className="num" style={{ textAlign: "center" }}>{pUnits.length}</td>
                          <td className="num" style={{ textAlign: "center", color: "var(--accent-deep)" }}>{pOccupied.length}</td>
                          <td className="num">¥{pRent.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* 送金履歴 */}
          {remittances.length > 0 && (
            <div className="section">
              <div className="section-head-bar">
                <h2>送金履歴</h2>
                <span className="desc">直近12ヶ月</span>
              </div>
              <div className="section-body flush">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>対象月</th>
                      <th style={{ textAlign: "right" }}>家賃収入</th>
                      <th style={{ textAlign: "right" }}>手数料</th>
                      <th style={{ textAlign: "right" }}>経費</th>
                      <th style={{ textAlign: "right" }}>送金額</th>
                      <th>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remittances.map((r: any) => (
                      <tr key={r.id} className="row-hover">
                        <td>
                          <Link href={`/remittances/${r.id}`} className="rlink">{r.remittance_month?.slice(0, 7)}</Link>
                        </td>
                        <td className="num">¥{Number(r.total_rent).toLocaleString()}</td>
                        <td className="num" style={{ color: "var(--danger)" }}>-¥{Number(r.management_fee_deducted).toLocaleString()}</td>
                        <td className="num" style={{ color: "var(--warn)" }}>
                          {Number(r.expense_deducted) > 0 ? `-¥${Number(r.expense_deducted).toLocaleString()}` : "—"}
                        </td>
                        <td className="num" style={{ fontWeight: 500, color: "var(--accent)" }}>¥{Number(r.net_amount).toLocaleString()}</td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* サイドカラム */}
        <div className="detail-col-side">
          {(owner.owner_type === "corporate" || owner.name_kana || owner.birth_date) && (
            <div className="section">
              <div className="section-head-bar"><h2>基本情報</h2></div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">区分</div>
                    <div className="field-value field-plain">
                      {owner.owner_type === "corporate" ? "法人" : "個人"}
                    </div>
                  </div>
                  {owner.owner_type === "corporate" && owner.company_name && (
                    <div className="field">
                      <div className="field-label mono">法人名</div>
                      <div className="field-value field-plain">{owner.company_name}</div>
                    </div>
                  )}
                  {owner.owner_type === "corporate" && owner.company_name_kana && (
                    <div className="field">
                      <div className="field-label mono">法人名カナ</div>
                      <div className="field-value field-plain">{owner.company_name_kana}</div>
                    </div>
                  )}
                  {owner.owner_type === "corporate" && owner.representative_name && (
                    <div className="field">
                      <div className="field-label mono">代表者</div>
                      <div className="field-value field-plain">{owner.representative_name}</div>
                    </div>
                  )}
                  {owner.name_kana && (
                    <div className="field">
                      <div className="field-label mono">フリガナ</div>
                      <div className="field-value field-plain">{owner.name_kana}</div>
                    </div>
                  )}
                  {owner.birth_date && (
                    <div className="field">
                      <div className="field-label mono">生年月日</div>
                      <div className="field-value field-plain mono">{owner.birth_date}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="section">
            <div className="section-head-bar"><h2>連絡先</h2></div>
            <div className="section-body">
              <div className="kv-list">
                {owner.phone && (
                  <div className="field">
                    <div className="field-label mono">電話番号</div>
                    <div className="field-value">
                      <a href={`tel:${owner.phone}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Phone size={13} /> <span className="mono">{formatPhone(owner.phone)}</span>
                      </a>
                    </div>
                  </div>
                )}
                {owner.mobile_phone && (
                  <div className="field">
                    <div className="field-label mono">携帯</div>
                    <div className="field-value">
                      <a href={`tel:${owner.mobile_phone}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Smartphone size={13} /> <span className="mono">{formatPhone(owner.mobile_phone)}</span>
                      </a>
                    </div>
                  </div>
                )}
                {owner.fax && (
                  <div className="field">
                    <div className="field-label mono">FAX</div>
                    <div className="field-value field-plain" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Printer size={13} /> <span className="mono">{formatPhone(owner.fax)}</span>
                    </div>
                  </div>
                )}
                {owner.email && (
                  <div className="field">
                    <div className="field-label mono">メール</div>
                    <div className="field-value">
                      <a href={`mailto:${owner.email}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Mail size={13} /> {owner.email}
                      </a>
                    </div>
                  </div>
                )}
                {owner.address && (
                  <div className="field">
                    <div className="field-label mono">住所</div>
                    <div className="field-value field-plain" style={{ fontSize: 12 }}>{owner.address}</div>
                  </div>
                )}
                {owner.mailing_address && (
                  <div className="field">
                    <div className="field-label mono">書類送付先</div>
                    <div className="field-value field-plain" style={{ fontSize: 12 }}>{owner.mailing_address}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(owner.emergency_contact_name || owner.emergency_contact_phone) && (
            <div className="section">
              <div className="section-head-bar"><h2>緊急連絡先</h2></div>
              <div className="section-body">
                <div className="kv-list">
                  {owner.emergency_contact_name && (
                    <div className="field">
                      <div className="field-label mono">氏名</div>
                      <div className="field-value field-plain">
                        {owner.emergency_contact_name}
                        {owner.emergency_contact_relation && (
                          <span style={{ color: "var(--ink-3)", marginLeft: 8 }}>
                            （{owner.emergency_contact_relation}）
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {owner.emergency_contact_phone && (
                    <div className="field">
                      <div className="field-label mono">電話</div>
                      <div className="field-value">
                        <a href={`tel:${owner.emergency_contact_phone}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Phone size={13} /> <span className="mono">{formatPhone(owner.emergency_contact_phone)}</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {(owner.invoice_number || owner.withholding_required) && (
            <div className="section">
              <div className="section-head-bar"><h2>税務情報</h2></div>
              <div className="section-body">
                <div className="kv-list">
                  {owner.invoice_number && (
                    <div className="field">
                      <div className="field-label mono">インボイス番号</div>
                      <div className="field-value field-plain mono">{owner.invoice_number}</div>
                    </div>
                  )}
                  {owner.withholding_required && (
                    <div className="field">
                      <div className="field-label mono">源泉徴収</div>
                      <div className="field-value field-plain">必要</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {owner.bank_name && (
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
                  {owner.bank_account_number && (
                    <div className="field">
                      <div className="field-label mono">口座番号</div>
                      <div className="field-value field-plain mono">{owner.bank_account_number}</div>
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
