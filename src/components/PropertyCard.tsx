"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, MapPin, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toWareki } from "@/lib/wareki";
import PropertyFormModal from "./PropertyFormModal";

interface Owner {
  id: string;
  name: string;
}

interface PropertyCardProps {
  property: Record<string, any>;
  owners: Owner[];
}

export default function PropertyCard({ property: prop, owners }: PropertyCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const propUnits = prop.units || [];
  const occupied = propUnits.filter((u: any) => u.status === "occupied").length;
  const vacant = propUnits.filter((u: any) => u.status === "vacant").length;
  const totalRent = propUnits.reduce((sum: number, u: any) => sum + Number(u.rent), 0);
  const occupancyRate = propUnits.length > 0 ? Math.round((occupied / propUnits.length) * 100) : 0;

  async function handleDelete() {
    if (!confirm("この物件を削除しますか？関連する部屋も全て削除されます。")) return;
    const res = await fetch(`/api/properties/${prop.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <>
      <div className="card card-interactive relative overflow-hidden flex">
        <Link href={`/properties/${prop.id}`} className="absolute inset-0 z-0" />

        {prop.thumbnail_url ? (
          <div className="w-32 sm:w-40 shrink-0 bg-bg-2">
            <img
              src={prop.thumbnail_url}
              alt={prop.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-32 sm:w-40 shrink-0 bg-bg-2 flex items-center justify-center">
            <Building2 size={28} className="text-ink-3/30" />
          </div>
        )}

        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold text-ink truncate">{prop.name}</h3>
              <p className="flex items-center gap-1 text-[12px] text-ink-3 mt-0.5 truncate">
                <MapPin size={11} className="shrink-0" />
                {prop.address}
              </p>
            </div>
            <div className="flex items-center gap-1.5 relative z-10 shrink-0 ml-2">
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                prop.property_type === "apartment" ? "bg-accent-tint text-accent" : "bg-bg-2 text-ink-3"
              }`}>
                {prop.property_type === "apartment" ? "マンション" :
                 prop.property_type === "house" ? "戸建て" :
                 prop.property_type === "commercial" ? "商業" : "駐車場"}
              </span>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1 rounded text-ink-3 hover:text-ink hover:bg-bg-2 transition-colors"
                >
                  <MoreVertical size={14} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-28 bg-surface rounded border border-line shadow-md z-50 overflow-hidden">
                      <button
                        onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-ink-2 hover:bg-bg-2 transition-colors"
                      >
                        <Pencil size={12} />
                        編集
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); handleDelete(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-danger hover:bg-danger-tint transition-colors"
                      >
                        <Trash2 size={12} />
                        削除
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-0 pointer-events-none">
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-ink-3">入居率</span>
                <span className="font-medium tabular-nums">{occupancyRate}%</span>
              </div>
              <div className="h-1 bg-bg-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${occupancyRate}%` }} />
              </div>
            </div>

            <div className="flex gap-2 text-center mb-3">
              <div className="flex-1 py-1.5 rounded bg-bg-2">
                <p className="text-[10px] text-ink-3">全戸数</p>
                <p className="text-[15px] font-semibold tabular-nums">{propUnits.length}</p>
              </div>
              <div className="flex-1 py-1.5 rounded bg-bg-2">
                <p className="text-[10px] text-ink-3">入居</p>
                <p className="text-[15px] font-semibold text-accent-deep tabular-nums">{occupied}</p>
              </div>
              <div className="flex-1 py-1.5 rounded bg-bg-2">
                <p className="text-[10px] text-ink-3">空室</p>
                <p className="text-[15px] font-semibold text-accent tabular-nums">{vacant}</p>
              </div>
              <div className="flex-1 py-1.5 rounded bg-bg-2">
                <p className="text-[10px] text-ink-3">家賃合計</p>
                <p className="text-[13px] font-semibold tabular-nums">¥{totalRent.toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-line flex items-center gap-3 text-[11px] text-ink-3">
              <span>{prop.structure} {prop.floors ? `${prop.floors}F` : ""}</span>
              <span>{prop.built_year ? `${toWareki(prop.built_year)}・築${new Date().getFullYear() - prop.built_year}年` : "築-年"}</span>
              <span>{prop.nearest_station} 徒歩{prop.walk_minutes}分</span>
              <span className="ml-auto font-medium text-ink-2">{prop.owner?.name}</span>
            </div>
          </div>
        </div>
      </div>

      <PropertyFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        owners={owners}
        editData={prop}
      />
    </>
  );
}
