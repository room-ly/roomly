import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { getPropertyDetail } from "@/lib/queries";
import PropertyDetailClient from "@/components/PropertyDetailClient";
import PropertyImages from "@/components/PropertyImages";
import UnitTable from "@/components/UnitTable";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPropertyDetail(id);
  if (!result) notFound();

  const { property, units, contracts } = result;
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
          <PropertyDetailClient propertyId={id} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "構造", value: `${property.structure || "—"} ${property.floors ? property.floors + "F" : ""}` },
          { label: "築年", value: property.built_year ? `${property.built_year}年（築${new Date().getFullYear() - property.built_year}年）` : "—" },
          { label: "入居率", value: `${units.length > 0 ? Math.round((occupied / units.length) * 100) : 0}%` },
          { label: "オーナー", value: property.owner?.name || "—" },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">{item.label}</p>
            <p className="text-[14px] font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      <PropertyImages propertyId={id} />

      <UnitTable propertyId={id} units={units} contracts={contracts} />
    </>
  );
}
