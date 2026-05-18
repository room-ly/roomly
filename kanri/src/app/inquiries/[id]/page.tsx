import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { getInquiryDetail, getPropertiesForSelect, getUnitsForSelect, getAllTenantsForSelect } from "@/lib/queries";
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
    getAllTenantsForSelect(),
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

          {/* 対応記録タイムライン */}
          <div style={{ padding: "12px 24px", minHeight: 200 }}>
            {inquiry.description && (
              <DetailTimelineEntry
                label={inquiry.tenant?.name || "入居者"}
                tag="入居者"
                tagColor="info"
                content={inquiry.description}
                time={inquiry.created_at?.slice(0, 16).replace("T", " ")}
              />
            )}

            {logs.map((log: any) => {
              const isCustomer = log.action_type === "customer_reply";
              const isNote = log.action_type === "note";
              return (
                <DetailTimelineEntry
                  key={log.id}
                  label={isCustomer ? (inquiry.tenant?.name || "入居者") : isNote ? "メモ" : "スタッフ"}
                  tag={isCustomer ? "入居者" : isNote ? "メモ" : "対応"}
                  tagColor={isCustomer ? "info" : isNote ? "neutral" : "accent"}
                  content={log.content}
                  time={log.created_at?.slice(0, 16).replace("T", " ")}
                />
              );
            })}

            {logs.length === 0 && !inquiry.description && (
              <div className="inq-empty">まだ対応記録がありません</div>
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

function DetailTimelineEntry({ label, tag, tagColor, content, time }: {
  label: string; tag: string; tagColor: string; content: string; time: string;
}) {
  const colors: Record<string, { bg: string; fg: string }> = {
    info: { bg: "var(--info-tint)", fg: "var(--info)" },
    accent: { bg: "var(--accent-tint)", fg: "var(--accent-deep)" },
    neutral: { bg: "var(--bg-2)", fg: "var(--ink-3)" },
  };
  const c = colors[tagColor] || colors.neutral;
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{ width: 64, flexShrink: 0, fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--font-mono)", lineHeight: "20px", paddingTop: 1 }}>
        {time?.slice(5)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
          <span style={{
            fontSize: 10, padding: "1px 6px", borderRadius: 4,
            background: c.bg, color: c.fg, fontWeight: 500,
          }}>{tag}</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{content}</p>
      </div>
    </div>
  );
}
