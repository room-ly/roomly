import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getPropertyDetail, getOwnersForSelect } from "@/lib/queries";
import { formatBuiltYear } from "@/lib/wareki";
import PropertyDetailClient from "@/components/PropertyDetailClient";
import PropertyImages from "@/components/PropertyImages";
import UnitTable from "@/components/UnitTable";
import DocumentSection from "@/components/DocumentSection";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, ownersRaw] = await Promise.all([
    getPropertyDetail(id),
    getOwnersForSelect(),
  ]);
  if (!result) notFound();

  const { property, units, contracts } = result;
  const owners = ownersRaw.map((o: { id: string; label: string }) => ({ id: o.id, name: o.label }));
  const occupied = units.filter((u: any) => u.status === "occupied").length;
  const occupancyPct = units.length > 0 ? Math.round((occupied / units.length) * 100) : 0;

  const managementFormLabels: Record<string, string> = {
    self: "自主管理",
    full_management: "全部委託",
    partial_management: "一部委託",
    sublet: "サブリース",
  };
  const transactionTypeLabels: Record<string, string> = {
    owner: "貸主",
    agent: "代理",
    intermediary: "仲介",
    sublet: "サブリース",
  };

  return (
    <>
      <div className="detail-back">
        <Link href="/properties" className="rlink is-muted is-back">← 物件一覧に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">{property.name}</h1>
            <div className="detail-kana" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={12} />
              {property.address}
            </div>
          </div>
        </div>
        <div className="detail-header-actions">
          <PropertyDetailClient propertyId={id} property={property} owners={owners} />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          {/* 物件詳細 */}
          <div className="section">
            <div className="section-head-bar"><h2>物件詳細</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                {property.nearest_station && (
                  <div className="field">
                    <div className="field-label mono">最寄り駅①</div>
                    <div className="field-value field-plain">{property.nearest_station} {property.walk_minutes != null ? `徒歩${property.walk_minutes}分` : ""}</div>
                  </div>
                )}
                {property.nearest_station_2 && (
                  <div className="field">
                    <div className="field-label mono">最寄り駅②</div>
                    <div className="field-value field-plain">{property.nearest_station_2} {property.walk_minutes_2 != null ? `徒歩${property.walk_minutes_2}分` : ""}</div>
                  </div>
                )}
                {property.nearest_station_3 && (
                  <div className="field">
                    <div className="field-label mono">最寄り駅③</div>
                    <div className="field-value field-plain">{property.nearest_station_3} {property.walk_minutes_3 != null ? `徒歩${property.walk_minutes_3}分` : ""}</div>
                  </div>
                )}
                {property.bus_station && (
                  <div className="field">
                    <div className="field-label mono">バス</div>
                    <div className="field-value field-plain">{property.bus_station} {property.bus_minutes != null ? `${property.bus_minutes}分` : ""}</div>
                  </div>
                )}
                {property.total_area_sqm && (
                  <div className="field">
                    <div className="field-label mono">延床面積</div>
                    <div className="field-value field-plain">{property.total_area_sqm}㎡</div>
                  </div>
                )}
                {property.building_area_sqm && (
                  <div className="field">
                    <div className="field-label mono">建築面積</div>
                    <div className="field-value field-plain">{property.building_area_sqm}㎡</div>
                  </div>
                )}
                {property.land_area_sqm && (
                  <div className="field">
                    <div className="field-label mono">敷地面積</div>
                    <div className="field-value field-plain">{property.land_area_sqm}㎡</div>
                  </div>
                )}
                {property.management_form && (
                  <div className="field">
                    <div className="field-label mono">管理形態</div>
                    <div className="field-value field-plain">{managementFormLabels[property.management_form] || property.management_form}</div>
                  </div>
                )}
                {property.management_company && (
                  <div className="field">
                    <div className="field-label mono">管理会社</div>
                    <div className="field-value field-plain">{property.management_company}</div>
                  </div>
                )}
                {property.parking && (
                  <div className="field">
                    <div className="field-label mono">駐車場</div>
                    <div className="field-value field-plain">{property.parking}{property.parking_fee ? ` ¥${Number(property.parking_fee).toLocaleString()}/月` : ""}</div>
                  </div>
                )}
                {property.land_use_zone && (
                  <div className="field">
                    <div className="field-label mono">用途地域</div>
                    <div className="field-value field-plain">{property.land_use_zone}</div>
                  </div>
                )}
                {(property.building_coverage_ratio || property.floor_area_ratio) && (
                  <div className="field">
                    <div className="field-label mono">建ぺい率/容積率</div>
                    <div className="field-value field-plain">
                      {property.building_coverage_ratio ? `${property.building_coverage_ratio}%` : "—"} / {property.floor_area_ratio ? `${property.floor_area_ratio}%` : "—"}
                    </div>
                  </div>
                )}
                {property.renovation_year && (
                  <div className="field">
                    <div className="field-label mono">改築</div>
                    <div className="field-value field-plain">{property.renovation_year}年{property.renovation_month ? `${property.renovation_month}月` : ""}</div>
                  </div>
                )}
                {property.transaction_type && (
                  <div className="field">
                    <div className="field-label mono">取引形態</div>
                    <div className="field-value field-plain">{transactionTypeLabels[property.transaction_type] || property.transaction_type}</div>
                  </div>
                )}
              </div>

              {property.common_facilities && property.common_facilities.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <span className="field-label mono">共用設備</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {property.common_facilities.map((f: string) => (
                      <span key={f} className="tag">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {property.appeal_points && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <span className="field-label mono">アピールポイント</span>
                  <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{property.appeal_points}</p>
                </div>
              )}
            </div>
          </div>

          <PropertyImages propertyId={id} />

          <UnitTable propertyId={id} propertyType={property.property_type} units={units} contracts={contracts} />

          <DocumentSection propertyId={id} />
        </div>

        {/* サイドカラム */}
        <div className="detail-col-side">
          {/* 概要 */}
          <div className="section">
            <div className="section-head-bar"><h2>概要</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">構造</div>
                  <div className="field-value field-plain">
                    {property.structure || "—"}
                    {property.floors ? ` ${property.floors}F` : ""}
                    {property.underground_floors ? ` B${property.underground_floors}F` : ""}
                  </div>
                </div>
                <div className="field">
                  <div className="field-label mono">築年</div>
                  <div className="field-value field-plain">
                    {property.built_year ? formatBuiltYear(property.built_year) : "—"}
                    {property.built_month ? `${property.built_month}月` : ""}
                  </div>
                </div>
                <div className="field">
                  <div className="field-label mono">入居率</div>
                  <div className="field-value field-plain">{occupancyPct}%（{occupied}/{units.length}戸）</div>
                </div>
              </div>
            </div>
          </div>

          {/* オーナー */}
          <div className="section">
            <div className="section-head-bar"><h2>オーナー</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">氏名</div>
                  <div className="field-value">
                    {property.owner?.name ? (
                      <Link href={`/owners/${property.owner.id}`} className="rlink">{property.owner.name}</Link>
                    ) : (
                      <span style={{ color: "var(--ink-4)" }}>未設定</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
