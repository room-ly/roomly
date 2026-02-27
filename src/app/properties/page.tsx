import Link from "next/link";
import { Plus, Building2, MapPin } from "lucide-react";
import { properties, units } from "@/lib/mock-data";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

export default function PropertiesPage() {
  return (
    <>
      <PageHeader
        title="物件管理"
        description={`${properties.length}件の管理物件`}
        action={
          <button className="btn-primary">
            <Plus size={16} />
            物件を追加
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {properties.map((prop) => {
          const propUnits = units.filter((u) => u.property_id === prop.id);
          const occupied = propUnits.filter((u) => u.status === "occupied").length;
          const vacant = propUnits.filter((u) => u.status === "vacant").length;
          const totalRent = propUnits.reduce((sum, u) => sum + u.rent, 0);
          const occupancyRate = propUnits.length > 0 ? Math.round((occupied / propUnits.length) * 100) : 0;

          return (
            <Link
              key={prop.id}
              href={`/properties/${prop.id}`}
              className="card card-interactive p-5 block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center">
                    <Building2 size={20} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">{prop.name}</h3>
                    <p className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                      <MapPin size={12} />
                      {prop.address}
                    </p>
                  </div>
                </div>
                <StatusBadge status={prop.property_type} label={prop.property_type === "apartment" ? "マンション" : prop.property_type} />
              </div>

              {/* 入居率バー */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-muted">入居率</span>
                  <span className="font-semibold text-text">{occupancyRate}%</span>
                </div>
                <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all"
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-2 rounded-lg bg-bg-secondary">
                  <p className="text-[11px] text-text-muted">全戸数</p>
                  <p className="text-lg font-bold">{propUnits.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-bg-secondary">
                  <p className="text-[11px] text-text-muted">入居</p>
                  <p className="text-lg font-bold text-success">{occupied}</p>
                </div>
                <div className="p-2 rounded-lg bg-bg-secondary">
                  <p className="text-[11px] text-text-muted">空室</p>
                  <p className="text-lg font-bold text-accent">{vacant}</p>
                </div>
                <div className="p-2 rounded-lg bg-bg-secondary">
                  <p className="text-[11px] text-text-muted">家賃合計</p>
                  <p className="text-sm font-bold">¥{totalRent.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-light flex items-center gap-4 text-xs text-text-muted">
                <span>{prop.structure} {prop.floors}F</span>
                <span>築{prop.built_year ? new Date().getFullYear() - prop.built_year : "-"}年</span>
                <span>{prop.nearest_station} 徒歩{prop.walk_minutes}分</span>
                <span className="ml-auto font-medium text-text-secondary">{prop.owner?.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
