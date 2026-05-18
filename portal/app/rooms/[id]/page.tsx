import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Train,
  Home,
  Ruler,
  Building,
  Calendar,
  ArrowLeft,
  Eye,
  Banknote,
} from "lucide-react";
import { fetchVacancyById } from "@/lib/queries";
import {
  formatRent,
  formatArea,
  structureLabel,
  propertyTypeLabel,
} from "@/lib/format";
import InquiryForm from "./InquiryForm";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = await fetchVacancyById(id);
  if (!v) notFound();

  const { unit } = v;
  const { property } = unit;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-accent hover:underline text-sm"
      >
        <ArrowLeft size={16} />
        物件一覧に戻る
      </Link>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-accent-light px-6 py-4 flex flex-wrap items-end gap-4">
          <div>
            <span className="text-accent font-bold text-3xl">
              ¥{formatRent(unit.rent)}
            </span>
            <span className="text-gray-600">/月</span>
          </div>
          {unit.management_fee > 0 && (
            <span className="text-sm text-gray-500">
              管理費 ¥{formatRent(unit.management_fee)}/月
            </span>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold">
              {property.name} {unit.unit_number}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
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
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <InfoItem
              icon={<Home size={16} />}
              label="間取り"
              value={unit.layout ?? "-"}
            />
            <InfoItem
              icon={<Ruler size={16} />}
              label="専有面積"
              value={formatArea(unit.area_sqm)}
            />
            <InfoItem
              icon={<Building size={16} />}
              label="建物種別"
              value={propertyTypeLabel(property.property_type)}
            />
            <InfoItem
              icon={<Building size={16} />}
              label="構造"
              value={structureLabel(property.structure)}
            />
            {property.built_year && (
              <InfoItem
                icon={<Calendar size={16} />}
                label="築年"
                value={`${property.built_year}年`}
              />
            )}
            {unit.floor && (
              <InfoItem
                icon={<Building size={16} />}
                label="階数"
                value={`${unit.floor}階${property.floors ? ` / ${property.floors}階建` : ""}`}
              />
            )}
            <InfoItem
              icon={<Calendar size={16} />}
              label="入居可能日"
              value={v.available_from}
            />
            <InfoItem
              icon={<Eye size={16} />}
              label="内見"
              value={v.viewing_available ? "可能" : "要相談"}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm border-t pt-4">
            <CostItem label="敷金" amount={unit.deposit} />
            <CostItem label="礼金" amount={unit.key_money} />
            <CostItem label="賃料" amount={unit.rent} />
            <CostItem label="管理費" amount={unit.management_fee} />
          </div>

          {unit.equipment && unit.equipment.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-sm mb-2">設備</h3>
              <div className="flex flex-wrap gap-2">
                {unit.equipment.map((eq) => (
                  <span
                    key={eq}
                    className="bg-gray-100 text-gray-700 text-xs rounded px-2.5 py-1"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {v.ad_comment && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-sm mb-2">募集コメント</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {v.ad_comment}
              </p>
            </div>
          )}
        </div>
      </div>

      <InquiryForm vacancyId={v.id} propertyName={`${property.name} ${unit.unit_number}`} />
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-accent mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function CostItem({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-accent">
        {amount > 0 ? `¥${formatRent(amount)}` : "-"}
      </p>
    </div>
  );
}
