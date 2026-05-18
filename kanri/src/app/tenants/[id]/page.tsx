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
                <div className="field">
                  <div className="field-label mono">氏名</div>
                  <div className="field-value field-plain">{tenant.name}</div>
                </div>
                {tenant.name_kana && (
                  <div className="field">
                    <div className="field-label mono">フリガナ</div>
                    <div className="field-value field-plain">{tenant.name_kana}</div>
                  </div>
                )}
                {tenant.phone && (
                  <div className="field">
                    <div className="field-label mono">電話番号</div>
                    <div className="field-value field-plain mono">{formatPhone(tenant.phone)}</div>
                  </div>
                )}
                {tenant.email && (
                  <div className="field">
                    <div className="field-label mono">メール</div>
                    <div className="field-value field-plain">{tenant.email}</div>
                  </div>
                )}
                {tenant.workplace && (
                  <div className="field">
                    <div className="field-label mono">勤務先</div>
                    <div className="field-value field-plain">{tenant.workplace}</div>
                  </div>
                )}
                {tenant.emergency_contact && (
                  <div className="field">
                    <div className="field-label mono">緊急連絡先</div>
                    <div className="field-value field-plain">{tenant.emergency_contact}</div>
                  </div>
                )}
                {tenant.emergency_phone && (
                  <div className="field">
                    <div className="field-label mono">緊急連絡先電話</div>
                    <div className="field-value field-plain mono">{formatPhone(tenant.emergency_phone)}</div>
                  </div>
                )}
                {tenant.guarantor_name && (
                  <div className="field">
                    <div className="field-label mono">保証人</div>
                    <div className="field-value field-plain">{tenant.guarantor_name}</div>
                  </div>
                )}
                {tenant.guarantor_phone && (
                  <div className="field">
                    <div className="field-label mono">保証人電話</div>
                    <div className="field-value field-plain mono">{formatPhone(tenant.guarantor_phone)}</div>
                  </div>
                )}
                {tenant.guarantor_address && (
                  <div className="field">
                    <div className="field-label mono">保証人住所</div>
                    <div className="field-value field-plain">{tenant.guarantor_address}</div>
                  </div>
                )}
              </div>
              {tenant.notes && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <span className="field-label mono">備考</span>
                  <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{tenant.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* 契約履歴 */}
          <div className="section">
            <div className="section-head-bar">
              <h2>契約履歴</h2>
              <span className="desc">{contracts.length}件</span>
            </div>
            <div className="section-body flush">
              {contracts.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "24px 0" }}>契約がありません</p>
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>物件・部屋</th>
                      <th>契約期間</th>
                      <th style={{ textAlign: "right" }}>賃料</th>
                      <th>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c: any) => (
                      <tr key={c.id} className="row-hover">
                        <td>
                          <Link href={`/contracts/${c.id}`} className="rlink">
                            {c.unit?.property?.name} {c.unit?.unit_number}
                          </Link>
                        </td>
                        <td className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.start_date} 〜 {c.end_date || "—"}</td>
                        <td className="num">¥{Number(c.rent).toLocaleString()}</td>
                        <td><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
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
                    <div className="field-value num">¥{Number(activeContract.rent).toLocaleString()}</div>
                  </div>
                  <div className="field">
                    <div className="field-label mono">契約満了</div>
                    <div className="field-value field-plain mono">{activeContract.end_date || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
