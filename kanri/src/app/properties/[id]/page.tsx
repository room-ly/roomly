import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { getPropertyDetail, getOwnersForSelect } from "@/lib/queries";
import { formatBuiltYear } from "@/lib/wareki";
import PropertyDetailClient from "@/components/PropertyDetailClient";
import PropertyImages from "@/components/PropertyImages";
import UnitTable from "@/components/UnitTable";

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

  return (
    <>
      <div className="mb-6">
        <Link href="/properties" className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors">
          <ArrowLeft size={13} />
          物件一覧に戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">{property.name}</h1>
            <p className="flex items-center gap-1 text-[13px] text-ink-3 mt-0.5">
              <MapPin size={12} />
              {property.address}
            </p>
          </div>
          <PropertyDetailClient propertyId={id} property={property} owners={owners} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">構造</p>
          <p className="text-[14px] font-medium">
            {property.structure || "—"}
            {property.floors ? ` 地上${property.floors}F` : ""}
            {property.underground_floors ? ` 地下${property.underground_floors}F` : ""}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">築年</p>
          <p className="text-[14px] font-medium">
            {property.built_year ? formatBuiltYear(property.built_year) : "—"}
            {property.built_month ? `${property.built_month}月` : ""}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">入居率</p>
          <p className="text-[14px] font-medium">{units.length > 0 ? Math.round((occupied / units.length) * 100) : 0}%</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">オーナー</p>
          <p className="text-[14px] font-medium">{property.owner?.name || "—"}</p>
        </div>
      </div>

      {/* 交通・建物詳細 */}
      <div className="card p-4 mb-6">
        <h3 className="text-[13px] font-semibold mb-3">物件詳細</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 text-[13px]">
          {property.nearest_station && (
            <div>
              <span className="text-ink-3">最寄り駅①</span>
              <p className="font-medium">{property.nearest_station} {property.walk_minutes != null ? `徒歩${property.walk_minutes}分` : ""}</p>
            </div>
          )}
          {property.nearest_station_2 && (
            <div>
              <span className="text-ink-3">最寄り駅②</span>
              <p className="font-medium">{property.nearest_station_2} {property.walk_minutes_2 != null ? `徒歩${property.walk_minutes_2}分` : ""}</p>
            </div>
          )}
          {property.nearest_station_3 && (
            <div>
              <span className="text-ink-3">最寄り駅③</span>
              <p className="font-medium">{property.nearest_station_3} {property.walk_minutes_3 != null ? `徒歩${property.walk_minutes_3}分` : ""}</p>
            </div>
          )}
          {property.bus_station && (
            <div>
              <span className="text-ink-3">バス</span>
              <p className="font-medium">{property.bus_station} {property.bus_minutes != null ? `${property.bus_minutes}分` : ""}</p>
            </div>
          )}
          {property.total_area_sqm && (
            <div>
              <span className="text-ink-3">延床面積</span>
              <p className="font-medium">{property.total_area_sqm}㎡</p>
            </div>
          )}
          {property.building_area_sqm && (
            <div>
              <span className="text-ink-3">建築面積</span>
              <p className="font-medium">{property.building_area_sqm}㎡</p>
            </div>
          )}
          {property.land_area_sqm && (
            <div>
              <span className="text-ink-3">敷地面積</span>
              <p className="font-medium">{property.land_area_sqm}㎡</p>
            </div>
          )}
          {property.management_form && (
            <div>
              <span className="text-ink-3">管理形態</span>
              <p className="font-medium">
                {{ self: "自主管理", full_management: "全部委託", partial_management: "一部委託", sublet: "サブリース" }[property.management_form as string] || property.management_form}
              </p>
            </div>
          )}
          {property.management_company && (
            <div>
              <span className="text-ink-3">管理会社</span>
              <p className="font-medium">{property.management_company}</p>
            </div>
          )}
          {property.parking && (
            <div>
              <span className="text-ink-3">駐車場</span>
              <p className="font-medium">{property.parking}{property.parking_fee ? ` ¥${Number(property.parking_fee).toLocaleString()}/月` : ""}</p>
            </div>
          )}
          {property.land_use_zone && (
            <div>
              <span className="text-ink-3">用途地域</span>
              <p className="font-medium">{property.land_use_zone}</p>
            </div>
          )}
          {(property.building_coverage_ratio || property.floor_area_ratio) && (
            <div>
              <span className="text-ink-3">建ぺい率/容積率</span>
              <p className="font-medium">
                {property.building_coverage_ratio ? `${property.building_coverage_ratio}%` : "—"} / {property.floor_area_ratio ? `${property.floor_area_ratio}%` : "—"}
              </p>
            </div>
          )}
          {property.renovation_year && (
            <div>
              <span className="text-ink-3">改築</span>
              <p className="font-medium">{property.renovation_year}年{property.renovation_month ? `${property.renovation_month}月` : ""}</p>
            </div>
          )}
          {property.transaction_type && (
            <div>
              <span className="text-ink-3">取引形態</span>
              <p className="font-medium">
                {{ owner: "貸主", agent: "代理", intermediary: "仲介", sublet: "サブリース" }[property.transaction_type as string] || property.transaction_type}
              </p>
            </div>
          )}
        </div>
        {property.common_facilities && property.common_facilities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-line">
            <span className="text-[11px] text-ink-3">共用設備</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {property.common_facilities.map((f: string) => (
                <span key={f} className="px-2 py-0.5 bg-bg-2 rounded text-[11px] text-ink-2">{f}</span>
              ))}
            </div>
          </div>
        )}
        {property.appeal_points && (
          <div className="mt-3 pt-3 border-t border-line">
            <span className="text-[11px] text-ink-3">アピールポイント</span>
            <p className="text-[13px] mt-1 whitespace-pre-wrap">{property.appeal_points}</p>
          </div>
        )}
      </div>

      <PropertyImages propertyId={id} />

      <UnitTable propertyId={id} units={units} contracts={contracts} />
    </>
  );
}
