import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { getRentBillingDetail } from "@/lib/queries";
import { formatPhone } from "@/lib/phone";
import RentHistoryAndDetail from "@/components/RentHistoryAndDetail";
import AuditLogSection from "@/components/AuditLogSection";

export default async function RentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRentBillingDetail(id);
  if (!result) notFound();

  const { current, history } = "current" in result
    ? result
    : { current: result, history: [result] };

  const contract = current.contract;
  const tenant = contract?.tenant;
  const unit = contract?.unit;
  const property = unit?.property;

  const totalBilled = history.reduce((s: number, b: any) => s + Number(b.total_amount), 0);
  const totalPaid = history.reduce((s: number, b: any) => {
    const payments = b.rent_payments || [];
    return s + payments.reduce((ps: number, p: any) => ps + Number(p.amount), 0);
  }, 0);

  return (
    <>
      <div className="detail-back">
        <Link href="/rent" className="rlink is-muted is-back">← 家賃管理に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">{property?.name} {unit?.unit_number}</h1>
            <div className="detail-kana">{tenant?.name} — 家賃履歴</div>
          </div>
        </div>
      </div>

      {/* サマリー */}
      <div className="cols-summary" style={{ marginBottom: 24 }}>
        <div className="sum-card">
          <span className="sum-label mono">請求累計</span>
          <span className="sum-value serif-i">¥{totalBilled.toLocaleString()}</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">入金累計</span>
          <span className="sum-value serif-i" style={{ color: "var(--accent-deep)" }}>¥{totalPaid.toLocaleString()}</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">請求回数</span>
          <span className="sum-value serif-i">{history.length}</span>
          <span className="sum-foot mono">ヶ月</span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          <RentHistoryAndDetail
            history={history}
            initialId={id}
            tenantName={tenant?.name || "—"}
            propertyName={property?.name || ""}
            unitNumber={unit?.unit_number || ""}
          />

          <AuditLogSection table="rent_billings" recordId={current.id} recordLabel="家賃請求" />
        </div>

        {/* サイドカラム */}
        <div className="detail-col-side">
          <div className="section">
            <div className="section-head-bar"><h2>入居者情報</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">氏名</div>
                  <div className="field-value">
                    <Link href={`/tenants/${tenant?.id}`} className="rlink">{tenant?.name || "—"}</Link>
                  </div>
                </div>
                {tenant?.phone && (
                  <div className="field">
                    <div className="field-label mono">電話番号</div>
                    <div className="field-value">
                      <a href={`tel:${tenant.phone}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Phone size={13} /> <span className="mono">{formatPhone(tenant.phone)}</span>
                      </a>
                    </div>
                  </div>
                )}
                {tenant?.email && (
                  <div className="field">
                    <div className="field-label mono">メール</div>
                    <div className="field-value">
                      <a href={`mailto:${tenant.email}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Mail size={13} /> {tenant.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-head-bar"><h2>物件情報</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">物件</div>
                  <div className="field-value">
                    <Link href={`/properties/${property?.id}`} className="rlink">{property?.name || "—"}</Link>
                  </div>
                </div>
                {property?.address && (
                  <div className="field">
                    <div className="field-label mono">住所</div>
                    <div className="field-value field-plain" style={{ fontSize: 12 }}>{property.address}</div>
                  </div>
                )}
                <div className="field">
                  <div className="field-label mono">部屋</div>
                  <div className="field-value field-plain mono">{unit?.unit_number || "—"}</div>
                </div>
                {contract?.id && (
                  <div className="field">
                    <div className="field-label mono">契約</div>
                    <div className="field-value">
                      <Link href={`/contracts/${contract.id}`} className="rlink">契約詳細を開く</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
