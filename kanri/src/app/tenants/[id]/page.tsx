import { notFound } from "next/navigation";
import Link from "next/link";


import { getTenantDetail } from "@/lib/queries";
import { formatPhone } from "@/lib/phone";
import StatusBadge from "@/components/StatusBadge";
import TenantDetailClient from "@/components/TenantDetailClient";

const AVATAR_TONES = [
  { bg: "#e8f0e8", fg: "#3f5a4c" },
  { bg: "#e1e8f1", fg: "#3a5580" },
  { bg: "#f8eed8", fg: "#8a6420" },
  { bg: "#fbe6dc", fg: "#8a4020" },
  { bg: "#e8e0f0", fg: "#5a4080" },
  { bg: "#d8e8e8", fg: "#2a5050" },
];

function avatarTone(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

const GENDER_LABELS: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

function Field({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (!value && value !== 0) return null;
  return (
    <div className="field">
      <div className="field-label mono">{label}</div>
      <div className={`field-value field-plain${mono ? " mono" : ""}`}>{value}</div>
    </div>
  );
}

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
  const tone = avatarTone(tenant.name || "");

  const hasEmergency = tenant.emergency_contact_name || tenant.emergency_contact_phone || tenant.emergency_contact_relation;
  const hasGuarantor = tenant.guarantor_name || tenant.guarantor_phone || tenant.guarantor_address
    || tenant.guarantor_name_kana || tenant.guarantor_date_of_birth || tenant.guarantor_workplace
    || tenant.guarantor_workplace_phone || tenant.guarantor_annual_income || tenant.guarantor_relation;

  return (
    <>
      <div className="detail-back">
        <Link href="/tenants" className="rlink is-muted is-back">← 入居者一覧に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <span className="tn-av" style={{
            width: 56, height: 56, fontSize: 20,
            background: tone.bg, color: tone.fg,
          }}>
            {(tenant.name || "?").charAt(0)}
          </span>
          <div>
            <h1 className="detail-title">{tenant.name}</h1>
            {tenant.name_kana && <div className="detail-kana">{tenant.name_kana}</div>}
          </div>
        </div>
        <div className="detail-header-actions">
          <TenantDetailClient tenant={tenant} />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          {/* 基本情報 */}
          <div className="section">
            <div className="section-head-bar"><h2>基本情報</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <Field label="氏名" value={tenant.name} />
                <Field label="フリガナ" value={tenant.name_kana} />
                <Field label="生年月日" value={tenant.date_of_birth} mono />
                <Field label="性別" value={tenant.gender ? GENDER_LABELS[tenant.gender] || tenant.gender : undefined} />
                <Field label="国籍" value={tenant.nationality} />
                <Field label="電話番号" value={tenant.phone ? formatPhone(tenant.phone) : undefined} mono />
                <Field label="メール" value={tenant.email} />
                <Field label="郵便番号" value={tenant.postal_code} mono />
                <Field label="住所" value={tenant.address} />
                <Field label="勤務先" value={tenant.workplace} />
                <Field label="勤務先電話" value={tenant.workplace_phone ? formatPhone(tenant.workplace_phone) : undefined} mono />
                <Field label="年収" value={tenant.annual_income ? `¥${Number(tenant.annual_income).toLocaleString()}` : undefined} />
              </div>
            </div>
          </div>

          {/* 緊急連絡先 */}
          {hasEmergency && (
            <div className="section">
              <div className="section-head-bar"><h2>緊急連絡先</h2></div>
              <div className="section-body">
                <div className="kv-grid">
                  <Field label="氏名" value={tenant.emergency_contact_name} />
                  <Field label="電話番号" value={tenant.emergency_contact_phone ? formatPhone(tenant.emergency_contact_phone) : undefined} mono />
                  <Field label="続柄" value={tenant.emergency_contact_relation} />
                </div>
              </div>
            </div>
          )}

          {/* 保証人情報 */}
          {hasGuarantor && (
            <div className="section">
              <div className="section-head-bar"><h2>保証人情報</h2></div>
              <div className="section-body">
                <div className="kv-grid">
                  <Field label="氏名" value={tenant.guarantor_name} />
                  <Field label="フリガナ" value={tenant.guarantor_name_kana} />
                  <Field label="生年月日" value={tenant.guarantor_date_of_birth} mono />
                  <Field label="電話番号" value={tenant.guarantor_phone ? formatPhone(tenant.guarantor_phone) : undefined} mono />
                  <Field label="続柄" value={tenant.guarantor_relation} />
                  <Field label="住所" value={tenant.guarantor_address} />
                  <Field label="勤務先" value={tenant.guarantor_workplace} />
                  <Field label="勤務先電話" value={tenant.guarantor_workplace_phone ? formatPhone(tenant.guarantor_workplace_phone) : undefined} mono />
                  <Field label="年収" value={tenant.guarantor_annual_income ? `¥${Number(tenant.guarantor_annual_income).toLocaleString()}` : undefined} />
                </div>
              </div>
            </div>
          )}

          {/* 備考 */}
          {tenant.notes && (
            <div className="section">
              <div className="section-head-bar"><h2>備考</h2></div>
              <div className="section-body">
                <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{tenant.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* サイドカラム */}
        <div className="detail-col-side">
          {activeContract && (
            <div className="section">
              <div className="section-head-bar"><h2>現在の入居先</h2></div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">物件</div>
                    <div className="field-value">
                      <Link href={`/properties/${activeContract.unit?.property?.id}`} className="rlink">
                        {activeContract.unit?.property?.name || "—"}
                      </Link>
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-label mono">部屋</div>
                    <div className="field-value field-plain mono">{activeContract.unit?.unit_number || "—"}</div>
                  </div>
                  <div className="field">
                    <div className="field-label mono">賃料</div>
                    <div className="field-value num" style={{ textAlign: "left" }}>¥{Number(activeContract.rent).toLocaleString()}</div>
                  </div>
                  <div className="field">
                    <div className="field-label mono">契約満了</div>
                    <div className="field-value field-plain mono">{activeContract.end_date || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="section">
            <div className="section-head-bar">
              <h2>契約履歴</h2>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--ink-4)" }}>{contracts.length}件</span>
            </div>
            <div className="section-body" style={{ padding: contracts.length === 0 ? undefined : "4px 16px 12px" }}>
              {contracts.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--ink-4)", textAlign: "center" }}>契約なし</p>
              ) : (
                <div className="related-list">
                  {contracts.map((c: any) => (
                    <Link key={c.id} href={`/contracts/${c.id}`} className="related-row" style={{ padding: "8px 8px", margin: "0 -8px" }}>
                      <div>
                        <div className="related-label" style={{ fontSize: 12.5 }}>
                          {c.unit?.property?.name} {c.unit?.unit_number}
                        </div>
                        <div className="related-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="mono">{c.start_date?.slice(0, 7)} 〜 {c.end_date?.slice(0, 7) || "—"}</span>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                      <span className="related-arrow">↗</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
