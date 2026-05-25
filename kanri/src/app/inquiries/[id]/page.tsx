import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { getInquiryDetail, getPropertiesForSelect, getUnitsForSelect, getAllTenantsForSelect } from "@/lib/queries";
import { formatPhone } from "@/lib/phone";
import StatusBadge from "@/components/StatusBadge";
import InquiryDetailClient from "@/components/InquiryDetailClient";
import InquiryLogSection from "@/components/InquiryLogSection";

const TYPE_LABELS: Record<string, string> = {
  move_out: "退去",
  maintenance: "修繕",
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

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">{inquiry.title}</h1>
            <div className="detail-kana" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StatusBadge status={inquiry.status} />
              <StatusBadge status={inquiry.priority} />
              <span style={{ color: "var(--ink-3)" }}>{TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}</span>
              <span className="mono" style={{ color: "var(--ink-4)" }}>{inquiry.created_at?.slice(0, 10)}</span>
            </div>
          </div>
        </div>
        <div className="detail-header-actions">
          <InquiryDetailClient inquiry={inquiry} properties={properties} units={units} tenants={tenants} />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          {/* 対応記録 */}
          <InquiryLogSection inquiry={inquiry} logs={logs} />

          {/* 備考 */}
          {inquiry.notes && (
            <div className="section">
              <div className="section-head-bar"><h2>備考</h2></div>
              <div className="section-body">
                <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{inquiry.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* サイドカラム */}
        <div className="detail-col-side">
          {inquiry.tenant && (
            <div className="section">
              <div className="section-head-bar"><h2>入居者情報</h2></div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">氏名</div>
                    <div className="field-value">
                      {inquiry.tenant.id ? (
                        <Link href={`/tenants/${inquiry.tenant.id}`} className="rlink">{inquiry.tenant.name}</Link>
                      ) : (
                        <span>{inquiry.tenant.name || "—"}</span>
                      )}
                    </div>
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
                      <div className="field-value field-plain mono">#{inquiry.unit.unit_number}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {inquiry.linked_maintenance && (
            <div className="section">
              <div className="section-head-bar"><h2>連携: 修繕依頼</h2></div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">件名</div>
                    <div className="field-value">
                      <Link href={`/maintenance/${inquiry.linked_maintenance.id}`} className="rlink">
                        {inquiry.linked_maintenance.title}
                      </Link>
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-label mono">状態</div>
                    <div className="field-value">
                      <StatusBadge status={inquiry.linked_maintenance.status} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {inquiry.linked_move_out_request && (
            <div className="section">
              <div className="section-head-bar"><h2>連携: 退去申請</h2></div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">退去予定日</div>
                    <div className="field-value field-plain mono">
                      {inquiry.linked_move_out_request.desired_move_out_date}
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-label mono">状態</div>
                    <div className="field-value">
                      <StatusBadge status={inquiry.linked_move_out_request.status} />
                    </div>
                  </div>
                  {inquiry.linked_move_out_request.contract?.id && (
                    <div className="field">
                      <div className="field-label mono">契約</div>
                      <div className="field-value">
                        <Link href={`/contracts/${inquiry.linked_move_out_request.contract.id}`} className="rlink">
                          契約詳細を確認 →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {inquiry.property?.owner?.name && (
            <div className="section">
              <div className="section-head-bar"><h2>オーナー情報</h2></div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">氏名</div>
                    <div className="field-value">
                      <Link href={`/owners/${inquiry.property.owner.id}`} className="rlink">{inquiry.property.owner.name}</Link>
                    </div>
                  </div>
                  {inquiry.property.owner.phone && (
                    <div className="field">
                      <div className="field-label mono">電話番号</div>
                      <div className="field-value">
                        <a href={`tel:${inquiry.property.owner.phone}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Phone size={13} /> <span className="mono">{formatPhone(inquiry.property.owner.phone)}</span>
                        </a>
                      </div>
                    </div>
                  )}
                  {inquiry.property.owner.email && (
                    <div className="field">
                      <div className="field-label mono">メール</div>
                      <div className="field-value">
                        <a href={`mailto:${inquiry.property.owner.email}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Mail size={13} /> {inquiry.property.owner.email}
                        </a>
                      </div>
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

