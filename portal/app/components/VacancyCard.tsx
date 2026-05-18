import Link from "next/link";
import { MapPin, Train, Home, Ruler } from "lucide-react";
import type { VacancyListing } from "@/lib/types";
import { formatRent, formatArea, propertyTypeLabel } from "@/lib/format";

export default function VacancyCard({ v }: { v: VacancyListing }) {
  const { unit } = v;
  const { property } = unit;

  return (
    <Link
      href={`/rooms/${v.id}`}
      className="block bg-white rounded-xl shadow-sm border hover:shadow-md transition overflow-hidden"
    >
      <div className="bg-accent-light px-4 py-2 flex items-center justify-between">
        <span className="text-accent font-bold text-lg">
          ¥{formatRent(unit.rent)}
          <span className="text-sm font-normal text-gray-600">/月</span>
        </span>
        {unit.management_fee > 0 && (
          <span className="text-xs text-gray-500">
            管理費 ¥{formatRent(unit.management_fee)}
          </span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-base">
          {property.name} {unit.unit_number}
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} />
            {property.address}
          </span>
          {property.nearest_station && (
            <span className="inline-flex items-center gap-1">
              <Train size={14} />
              {property.nearest_station}
              {property.walk_minutes && ` 徒歩${property.walk_minutes}分`}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {unit.layout && (
            <span className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5">
              <Home size={12} />
              {unit.layout}
            </span>
          )}
          {unit.area_sqm && (
            <span className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5">
              <Ruler size={12} />
              {formatArea(unit.area_sqm)}
            </span>
          )}
          <span className="bg-gray-100 rounded px-2 py-0.5">
            {propertyTypeLabel(property.property_type)}
          </span>
          {unit.deposit > 0 && (
            <span className="bg-gray-100 rounded px-2 py-0.5">
              敷金 ¥{formatRent(unit.deposit)}
            </span>
          )}
          {unit.key_money > 0 && (
            <span className="bg-gray-100 rounded px-2 py-0.5">
              礼金 ¥{formatRent(unit.key_money)}
            </span>
          )}
        </div>
        {v.ad_comment && (
          <p className="text-xs text-gray-500 line-clamp-2">{v.ad_comment}</p>
        )}
      </div>
    </Link>
  );
}
