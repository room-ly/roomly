import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getUnitDetail } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import UnitDetailClient from "@/components/UnitDetailClient";
import PropertyImages from "@/components/PropertyImages";
import AuditLogSection from "@/components/AuditLogSection";

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const result = await getUnitDetail(unitId);
  if (!result || result.unit.property_id !== id) notFound();

  const { unit, contracts, cases } = result;
  const activeContract = contracts.find((c: any) => c.status === "active");

  return (
    <>
      <div className="detail-back">
        <Link href={`/properties/${id}`} className="rlink is-muted is-back">← {unit.property?.name || "物件詳細"}に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">{unit.unit_number}号室</h1>
            {unit.property?.address && (
              <div className="detail-kana" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={12} />
                {unit.property.address}
              </div>
            )}
          </div>
          <div style={{ marginLeft: 8 }}>
            <StatusBadge status={unit.status} />
          </div>
        </div>
        <div className="detail-header-actions">
          <UnitDetailClient propertyId={id} unit={unit} activeContract={activeContract ?? null} />
        </div>
      </div>

      <PropertyImages propertyId={id} unitId={unitId} readOnly />

      <div className="detail-grid">
        <div className="detail-col-main">
          {/* 基本情報 */}
          <div className="section">
            <div className="section-head-bar"><h2>基本情報</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">階</div>
                  <div className="field-value field-plain">{unit.floor ? `${unit.floor}F` : "—"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">間取り</div>
                  <div className="field-value field-plain">{unit.layout || "—"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">面積</div>
                  <div className="field-value field-plain">{unit.area_sqm ? `${Number(unit.area_sqm)}m²` : "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 賃料・費用 */}
          <div className="section">
            <div className="section-head-bar"><h2>賃料・費用</h2></div>
            <div className="section-body">
              <div className="cfee-grid">
                <div className="cfee-main">
                  <div className="cfee-label mono">月額合計</div>
                  <div className="cfee-value">¥{(Number(unit.rent) + Number(unit.management_fee)).toLocaleString()}</div>
                </div>
                <div className="cfee-item">
                  <div className="cfee-label mono">賃料</div>
                  <div className="cfee-sub num">¥{Number(unit.rent).toLocaleString()}</div>
                </div>
                <div className="cfee-item">
                  <div className="cfee-label mono">管理費</div>
                  <div className="cfee-sub num">¥{Number(unit.management_fee).toLocaleString()}</div>
                </div>
              </div>
              <div className="kv-grid" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <div className="field">
                  <div className="field-label mono">敷金</div>
                  <div className="field-value num">¥{Number(unit.deposit || 0).toLocaleString()}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">礼金</div>
                  <div className="field-value num">¥{Number(unit.key_money || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 設備・備考 */}
          {((unit.equipment && unit.equipment.length > 0) || unit.notes) && (
            <div className="section">
              <div className="section-head-bar"><h2>設備・備考</h2></div>
              <div className="section-body">
                {unit.equipment && unit.equipment.length > 0 && (
                  <div style={{ marginBottom: unit.notes ? 16 : 0 }}>
                    <span className="field-label mono">設備</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {unit.equipment.map((eq: string) => (
                        <span key={eq} className="tag">{eq}</span>
                      ))}
                    </div>
                  </div>
                )}
                {unit.notes && (
                  <div style={{ paddingTop: unit.equipment?.length ? 16 : 0, borderTop: unit.equipment?.length ? "1px solid var(--line)" : "none" }}>
                    <span className="field-label mono">備考</span>
                    <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{unit.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* サイドカラム */}
        <div className="detail-col-side">
          {activeContract && (
            <div className="section">
              <div className="section-head-bar"><h2>現在の契約</h2></div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">入居者</div>
                    <div className="field-value">
                      <Link href={`/tenants/${activeContract.tenant?.id}`} className="rlink">{activeContract.tenant?.name || "—"}</Link>
                    </div>
                  </div>
                  <div className="field">
                    <div className="field-label mono">電話番号</div>
                    <div className="field-value field-plain mono">{activeContract.tenant?.phone || "—"}</div>
                  </div>
                  <div className="field">
                    <div className="field-label mono">契約開始</div>
                    <div className="field-value field-plain mono">{activeContract.start_date || "—"}</div>
                  </div>
                  <div className="field">
                    <div className="field-label mono">契約終了</div>
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
                        <div className="related-label" style={{ fontSize: 12.5 }}>{c.tenant?.name || "—"}</div>
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

          {cases.length > 0 && (
            <div className="section">
              <div className="section-head-bar">
                <h2>対応案件履歴</h2>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--ink-4)" }}>{cases.length}件</span>
              </div>
              <div className="section-body" style={{ padding: "4px 16px 12px" }}>
                <div className="related-list">
                  {cases.map((m: any) => (
                    <Link key={m.id} href={`/cases/${m.id}`} className="related-row" style={{ padding: "8px 8px", margin: "0 -8px" }}>
                      <div>
                        <div className="related-label" style={{ fontSize: 12.5 }}>{m.title || "—"}</div>
                        <div className="related-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="mono">{m.reported_date}</span>
                          <StatusBadge status={m.status} />
                        </div>
                      </div>
                      <span className="related-arrow">↗</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          <AuditLogSection table="units" recordId={unitId} recordLabel="部屋" />
        </div>
      </div>
    </>
  );
}
