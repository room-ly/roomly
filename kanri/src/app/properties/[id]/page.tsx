import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getPropertyDetail, getOwnersForSelect, getUsersForSelect } from "@/lib/queries";
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
  const [result, ownersRaw, users] = await Promise.all([
    getPropertyDetail(id),
    getOwnersForSelect(),
    getUsersForSelect(),
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
  const propertyTypeLabels: Record<string, string> = {
    apartment: "マンション",
    apart: "アパート",
    house: "戸建て",
    parking: "駐車場",
    land: "土地",
    commercial: "商業",
  };
  const landRightsLabels: Record<string, string> = {
    ownership: "所有権",
    leasehold: "借地権",
    sublease: "転借地権",
  };
  const v = (val: any) =>
    val === null || val === undefined || val === "" ? "—" : String(val);
  const yn = (val: any) => (val ? "あり" : "なし");
  const zone = (val: any) => (val ? "区域内" : "区域外");
  const yen = (val: any) =>
    val === null || val === undefined || val === "" ? "—" : `¥${Number(val).toLocaleString()}`;

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
          <PropertyDetailClient
            propertyId={id}
            property={property}
            owners={owners}
            users={users}
            units={units}
            contracts={contracts}
          />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          <PropertyImages propertyId={id} readOnly />

          {/* 基本情報 */}
          <div className="section">
            <div className="section-head-bar"><h2>基本情報</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">物件名</div>
                  <div className="field-value field-plain">{v(property.name)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">物件名（カナ）</div>
                  <div className="field-value field-plain">{v(property.name_kana)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">物件種別</div>
                  <div className="field-value field-plain">{propertyTypeLabels[property.property_type] || v(property.property_type)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">物件コード</div>
                  <div className="field-value field-plain">{v(property.property_code)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 所在地 */}
          <div className="section">
            <div className="section-head-bar"><h2>所在地</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">郵便番号</div>
                  <div className="field-value field-plain mono">{v(property.postal_code)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">住所</div>
                  <div className="field-value field-plain">{v(property.address)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">建物番号</div>
                  <div className="field-value field-plain">{v(property.building_number)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">緯度／経度</div>
                  <div className="field-value field-plain mono">
                    {property.latitude != null ? property.latitude : "—"} / {property.longitude != null ? property.longitude : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 交通 */}
          <div className="section">
            <div className="section-head-bar"><h2>交通</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">最寄り駅①</div>
                  <div className="field-value field-plain">
                    {property.nearest_station ? `${property.nearest_station}${property.walk_minutes != null ? ` 徒歩${property.walk_minutes}分` : ""}` : "—"}
                  </div>
                </div>
                <div className="field">
                  <div className="field-label mono">最寄り駅②</div>
                  <div className="field-value field-plain">
                    {property.nearest_station_2 ? `${property.nearest_station_2}${property.walk_minutes_2 != null ? ` 徒歩${property.walk_minutes_2}分` : ""}` : "—"}
                  </div>
                </div>
                <div className="field">
                  <div className="field-label mono">最寄り駅③</div>
                  <div className="field-value field-plain">
                    {property.nearest_station_3 ? `${property.nearest_station_3}${property.walk_minutes_3 != null ? ` 徒歩${property.walk_minutes_3}分` : ""}` : "—"}
                  </div>
                </div>
                <div className="field">
                  <div className="field-label mono">バス</div>
                  <div className="field-value field-plain">
                    {property.bus_station ? `${property.bus_station}${property.bus_minutes != null ? ` ${property.bus_minutes}分` : ""}` : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 建物 */}
          <div className="section">
            <div className="section-head-bar"><h2>建物</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">構造</div>
                  <div className="field-value field-plain">{v(property.structure)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">地上階数</div>
                  <div className="field-value field-plain">{property.floors ? `${property.floors}F` : "—"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">地下階数</div>
                  <div className="field-value field-plain">{property.underground_floors ? `B${property.underground_floors}F` : "—"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">築年月</div>
                  <div className="field-value field-plain">
                    {property.built_year ? `${formatBuiltYear(property.built_year)}${property.built_month ? `${property.built_month}月` : ""}` : "—"}
                  </div>
                </div>
                <div className="field">
                  <div className="field-label mono">改築年月</div>
                  <div className="field-value field-plain">
                    {property.renovation_year ? `${property.renovation_year}年${property.renovation_month ? `${property.renovation_month}月` : ""}` : "—"}
                  </div>
                </div>
                <div className="field">
                  <div className="field-label mono">延床面積</div>
                  <div className="field-value field-plain">{property.total_area_sqm ? `${property.total_area_sqm}㎡` : "—"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">建築面積</div>
                  <div className="field-value field-plain">{property.building_area_sqm ? `${property.building_area_sqm}㎡` : "—"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">敷地面積</div>
                  <div className="field-value field-plain">{property.land_area_sqm ? `${property.land_area_sqm}㎡` : "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 管理・駐車場 */}
          <div className="section">
            <div className="section-head-bar"><h2>管理・駐車場</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">管理形態</div>
                  <div className="field-value field-plain">{property.management_form ? (managementFormLabels[property.management_form] || property.management_form) : "—"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">管理会社</div>
                  <div className="field-value field-plain">{v(property.management_company)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">管理手数料</div>
                  <div className="field-value field-plain">
                    {property.management_fee_type === "fixed"
                      ? (property.management_fee_amount ? `${yen(property.management_fee_amount)}／月` : "—")
                      : (property.management_fee_rate != null ? `${property.management_fee_rate}%` : "—")}
                  </div>
                </div>
                <div className="field">
                  <div className="field-label mono">駐車場</div>
                  <div className="field-value field-plain">{property.parking ? `${property.parking}${property.parking_fee ? ` ${yen(property.parking_fee)}/月` : ""}` : "—"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">駐輪場</div>
                  <div className="field-value field-plain">{v(property.bicycle_parking)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">バイク置場</div>
                  <div className="field-value field-plain">{v(property.bike_parking)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 共用設備 */}
          <div className="section">
            <div className="section-head-bar"><h2>共用設備</h2></div>
            <div className="section-body">
              {property.common_facilities && property.common_facilities.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {property.common_facilities.map((f: string) => (
                    <span key={f} className="tag">{f}</span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--ink-4)" }}>—</p>
              )}
            </div>
          </div>

          {/* 用途地域・法規 */}
          <div className="section">
            <div className="section-head-bar"><h2>用途地域・法規</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">用途地域</div>
                  <div className="field-value field-plain">{v(property.land_use_zone)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">土地権利</div>
                  <div className="field-value field-plain">{property.land_rights ? (landRightsLabels[property.land_rights] || property.land_rights) : "—"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">建ぺい率</div>
                  <div className="field-value field-plain">{property.building_coverage_ratio != null ? `${property.building_coverage_ratio}%` : "—"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">容積率</div>
                  <div className="field-value field-plain">{property.floor_area_ratio != null ? `${property.floor_area_ratio}%` : "—"}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">地目</div>
                  <div className="field-value field-plain">{v(property.zoning)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 登記情報 */}
          <div className="section">
            <div className="section-head-bar"><h2>登記情報</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">登記名義人</div>
                  <div className="field-value field-plain">{v(property.registered_owner_name)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">抵当権</div>
                  <div className="field-value field-plain">{yn(property.mortgage_exists)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">抵当権者</div>
                  <div className="field-value field-plain">{v(property.mortgagee)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">抵当権額</div>
                  <div className="field-value field-plain mono">{yen(property.mortgage_amount)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* インフラ */}
          <div className="section">
            <div className="section-head-bar"><h2>インフラ</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">水道</div>
                  <div className="field-value field-plain">{v(property.water_supply)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">ガス</div>
                  <div className="field-value field-plain">{v(property.gas_type)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">電気</div>
                  <div className="field-value field-plain">{v(property.electricity)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">排水</div>
                  <div className="field-value field-plain">{v(property.sewage)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">浄化槽</div>
                  <div className="field-value field-plain">{yn(property.septic_tank)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* リスク調査 */}
          <div className="section">
            <div className="section-head-bar"><h2>リスク調査</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">石綿調査</div>
                  <div className="field-value field-plain">{v(property.asbestos_survey)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">耐震診断</div>
                  <div className="field-value field-plain">{v(property.earthquake_resistance)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">洪水ハザード</div>
                  <div className="field-value field-plain">{zone(property.flood_hazard_zone)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">土砂災害ハザード</div>
                  <div className="field-value field-plain">{zone(property.landslide_hazard_zone)}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">津波ハザード</div>
                  <div className="field-value field-plain">{zone(property.tsunami_hazard_zone)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 取引・備考 */}
          <div className="section">
            <div className="section-head-bar"><h2>取引・備考</h2></div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">取引形態</div>
                  <div className="field-value field-plain">{property.transaction_type ? (transactionTypeLabels[property.transaction_type] || property.transaction_type) : "—"}</div>
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <span className="field-label mono">アピールポイント</span>
                <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{property.appeal_points || "—"}</p>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <span className="field-label mono">備考</span>
                <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{property.notes || "—"}</p>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <span className="field-label mono">社内メモ</span>
                <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{property.internal_memo || "—"}</p>
              </div>
            </div>
          </div>

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
