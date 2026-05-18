"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatBuiltYear } from "@/lib/wareki";
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

  const typeLabels: Record<string, string> = {
    apartment: "マンション", apart: "アパート", house: "戸建て",
    parking: "駐車場", land: "土地", commercial: "商業",
  };
  const typeLabel = typeLabels[prop.property_type] || prop.property_type;
  const isApt = prop.property_type === "apartment" || prop.property_type === "apart";

  return (
    <>
      <div className="prop-card-h" onClick={() => router.push(`/properties/${prop.id}`)}>
        {prop.thumbnail_url ? (
          <div className="prop-h-thumb">
            <img
              src={prop.thumbnail_url}
              alt={prop.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ) : (
          <div className="prop-h-thumb">
            <Building2 size={28} style={{ color: "var(--ink-4)", opacity: 0.3 }} />
          </div>
        )}

        <div className="prop-h-body">
          <div className="prop-h-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3>{prop.name}</h3>
              <div className="prop-h-addr">{prop.address}</div>
            </div>
            <span className={`prop-h-type${isApt ? " is-apt" : ""}`}>{typeLabel}</span>
            <div style={{ position: "relative", zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="icon-btn"
                style={{ width: 24, height: 24 }}
              >
                <MoreVertical size={14} />
              </button>
              {menuOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
                  <div style={{
                    position: "absolute", right: 0, top: "100%", marginTop: 4,
                    width: 112, background: "var(--surface)", border: "1px solid var(--line)",
                    borderRadius: "var(--r-md)", boxShadow: "0 4px 12px rgba(40,32,12,.1)",
                    zIndex: 50, overflow: "hidden"
                  }}>
                    <button
                      onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 12, color: "var(--ink-2)" }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "var(--bg-2)"; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.background = ""; }}
                    >
                      <Pencil size={12} /> 編集
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); handleDelete(); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 12, color: "var(--danger)" }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "var(--danger-tint)"; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.background = ""; }}
                    >
                      <Trash2 size={12} /> 削除
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="prop-h-occ-row">
              <span>入居率 <span className="num"><b>{occupancyRate}</b>%</span></span>
              <span className="mono">{occupied}/{propUnits.length}戸</span>
            </div>
            <div className="prop-h-occ-bar">
              <div className="prop-h-occ-fill" style={{ width: `${occupancyRate}%` }} />
            </div>
          </div>

          <div className="prop-h-stats">
            <div className="prop-h-stat">
              <span className="k">全戸数</span>
              <span className="v">{propUnits.length}</span>
            </div>
            <div className="prop-h-stat">
              <span className="k">入居</span>
              <span className="v">{occupied}</span>
            </div>
            <div className="prop-h-stat">
              <span className="k">空室</span>
              <span className="v">{vacant}</span>
            </div>
            <div className="prop-h-stat">
              <span className="k">家賃合計</span>
              <span className="v" style={{ fontSize: 12 }}>¥{totalRent.toLocaleString()}<small>/月</small></span>
            </div>
          </div>

          <div className="prop-h-foot">
            <span>{prop.structure} {prop.floors ? `${prop.floors}F` : ""}</span>
            <span className="dot-sep">·</span>
            <span>{prop.built_year ? formatBuiltYear(prop.built_year) : "築-年"}</span>
            {prop.nearest_station && (
              <>
                <span className="dot-sep">·</span>
                <span>{prop.nearest_station} 徒歩{prop.walk_minutes}分</span>
              </>
            )}
            <span style={{ marginLeft: "auto", fontWeight: 500, color: "var(--ink-2)" }}>{prop.owner?.name}</span>
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
