import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { getInquiryDetail, getPropertiesForSelect, getUnitsForSelect, getTenantsForSelect } from "@/lib/queries";
import { formatPhone } from "@/lib/phone";
import StatusBadge from "@/components/StatusBadge";
import InquiryDetailClient from "@/components/InquiryDetailClient";

const TYPE_LABELS: Record<string, string> = {
  move_out: "退去",
  complaint: "クレーム",
  other: "その他",
  general: "その他",
  noise: "騒音",
  facility: "設備",
};

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, properties, units, tenants] = await Promise.all([
    getInquiryDetail(id),
    getPropertiesForSelect(),
    getUnitsForSelect(),
    getTenantsForSelect(),
  ]);
  if (!result) notFound();

  const { inquiry, logs } = result;

  return (
    <>
      <div className="detail-back">
        <Link href="/inquiries" className="rlink is-muted is-back">← 問い合わせ一覧に戻る</Link>
      </div>

      {/* 2-pane風レイアウト */}
      <div className="inq-pane" style={{ minHeight: "auto" }}>
        {/* ヘッダー */}
        <div className="inq-detail" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column" }}>
          <div className="inq-detail-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 className="inq-detail-subject">{inquiry.title}</h1>
              <div className="inq-detail-meta">
                <StatusBadge status={inquiry.status} />
                <StatusBadge status={inquiry.priority} />
                <span style={{ color: "var(--ink-3)" }}>{TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}</span>
                <span className="mono" style={{ color: "var(--ink-4)" }}>{inquiry.created_at?.slice(0, 10)}</span>
              </div>
            </div>
            <div className="inq-detail-actions">
              <InquiryDetailClient inquiry={inquiry} properties={properties} units={units} tenants={tenants} />
            </div>
          </div>

          {/* スレッド */}
          <div className="inq-thread" style={{ minHeight: 200, maxHeight: "none" }}>
            {/* 最初のメッセージ（問い合わせ内容） */}
            {inquiry.description && (
              <div className="inq-msg inq-msg-in with-avatar">
                <div className="inq-msg-avatar-slot">
                  <span className="tn-av" style={{
                    width: 32, height: 32, fontSize: 12,
                    background: "var(--info-tint)", color: "var(--info)",
                  }}>
                    {(inquiry.tenant?.name || "?").charAt(0)}
                  </span>
                </div>
                <div className="inq-msg-content">
                  <div className="inq-msg-head">
                    <span className="strong">{inquiry.tenant?.name || "入居者"}</span>
                    <span className="inq-from-tag inq-from-tenant">入居者</span>
                    <span style={{ fontSize: 10, color: "var(--ink-4)" }}>{inquiry.created_at?.slice(0, 16).replace("T", " ")}</span>
                  </div>
                  <div className="inq-msg-bubble">
                    <p className="inq-msg-body">{inquiry.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 対応履歴をチャットバブルで表示 */}
            {logs.map((log: any) => {
              const isStaff = log.action_type !== "customer_reply";
              return (
                <div key={log.id} className={`inq-msg ${isStaff ? "inq-msg-out" : "inq-msg-in"} with-avatar`}>
                  <div className="inq-msg-avatar-slot">
                    <span className="tn-av" style={{
                      width: 32, height: 32, fontSize: 12,
                      background: isStaff ? "var(--accent-tint)" : "var(--info-tint)",
                      color: isStaff ? "var(--accent-deep)" : "var(--info)",
                    }}>
                      {isStaff ? "S" : (inquiry.tenant?.name || "?").charAt(0)}
                    </span>
                  </div>
                  <div className="inq-msg-content">
                    <div className="inq-msg-head">
                      <span className="strong">{isStaff ? "スタッフ" : inquiry.tenant?.name || "入居者"}</span>
                      {log.action_type && <span className="inq-msg-tag mono">{log.action_type}</span>}
                    </div>
                    <div className="inq-msg-bubble">
                      <p className="inq-msg-body">{log.content}</p>
                    </div>
                    <span className="inq-msg-time mono">{log.created_at?.slice(0, 16).replace("T", " ")}</span>
                  </div>
                </div>
              );
            })}

            {logs.length === 0 && !inquiry.description && (
              <div className="inq-empty">まだ対応履歴がありません</div>
            )}
          </div>

          {/* 備考 */}
          {inquiry.notes && (
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>備考</span>
              <p style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" as const, color: "var(--ink-2)" }}>{inquiry.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* サイド情報 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        {inquiry.property && (
          <div className="section">
            <div className="section-head-bar"><h2>物件情報</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">物件</div>
                  <div className="field-value">
                    <Link href={`/properties/${inquiry.property.id}`} className="rlink">{inquiry.property.name}</Link>
                  </div>
                </div>
                {inquiry.unit?.unit_number && (
                  <div className="field">
                    <div className="field-label mono">部屋</div>
                    <div className="field-value field-plain mono">{inquiry.unit.unit_number}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {inquiry.tenant && (
          <div className="section">
            <div className="section-head-bar"><h2>入居者情報</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">氏名</div>
                  <div className="field-value strong">{inquiry.tenant.name}</div>
                </div>
                {inquiry.tenant.phone && (
                  <div className="field">
                    <div className="field-label mono">電話番号</div>
                    <div className="field-value">
                      <a href={`tel:${inquiry.tenant.phone}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Phone size={13} /> <span className="mono">{formatPhone(inquiry.tenant.phone)}</span>
                      </a>
                    </div>
                  </div>
                )}
                {inquiry.tenant.email && (
                  <div className="field">
                    <div className="field-label mono">メール</div>
                    <div className="field-value">
                      <a href={`mailto:${inquiry.tenant.email}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Mail size={13} /> {inquiry.tenant.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
