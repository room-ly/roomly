"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, SlidersHorizontal, Check } from "lucide-react";
import PropertyCard from "./PropertyCard";

interface Owner {
  id: string;
  name: string;
}

interface PropertiesGridProps {
  properties: Record<string, any>[];
  owners: Owner[];
}

type FilterKey = "all" | "apartment" | "apart" | "house" | "parking" | "land" | "commercial";

const TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "apartment", label: "マンション" },
  { key: "apart", label: "アパート" },
  { key: "house", label: "戸建て" },
  { key: "parking", label: "駐車場" },
  { key: "land", label: "土地" },
  { key: "commercial", label: "商業" },
];

type SortKey = "name" | "rent" | "occupancy" | "units" | "built_year";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "物件名" },
  { key: "rent", label: "家賃合計" },
  { key: "occupancy", label: "入居率" },
  { key: "units", label: "戸数" },
  { key: "built_year", label: "築年" },
];

// 入居状況フィルタ
type OccupancyFilter = "all" | "has_vacancy" | "full";

// カード表示と同じ集計（ソート・フィルタ用）
function stats(p: Record<string, any>) {
  const units = p.units || [];
  const occupied = units.filter((u: any) => u.status === "occupied").length;
  const vacant = units.filter((u: any) => u.status === "vacant").length;
  const totalRent = units.reduce((s: number, u: any) => s + Number(u.rent || 0), 0);
  const occupancyRate = units.length > 0 ? occupied / units.length : 0;
  return { unitCount: units.length, occupied, vacant, totalRent, occupancyRate };
}

export default function PropertiesGrid({ properties, owners }: PropertiesGridProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyFilter>("all");

  const totals = useMemo(() => {
    const counts: Record<string, number> = { all: properties.length };
    for (const tab of TABS) {
      if (tab.key !== "all") {
        counts[tab.key] = properties.filter((p) => p.property_type === tab.key).length;
      }
    }
    return counts;
  }, [properties]);

  const visibleTabs = useMemo(() => {
    return TABS.filter((t) => t.key === "all" || totals[t.key] > 0);
  }, [totals]);

  // 詳細フィルタが効いているか（バッジ表示用）
  const filterActive = ownerFilter !== "all" || occupancyFilter !== "all";

  const filtered = useMemo(() => {
    let result = properties;
    // 物件種別タブ
    if (filter !== "all") {
      result = result.filter((p) => p.property_type === filter);
    }
    // オーナー
    if (ownerFilter !== "all") {
      result = result.filter((p) => p.owner_id === ownerFilter);
    }
    // 入居状況
    if (occupancyFilter !== "all") {
      result = result.filter((p) => {
        const s = stats(p);
        if (s.unitCount === 0) return false;
        return occupancyFilter === "has_vacancy" ? s.vacant > 0 : s.vacant === 0;
      });
    }
    // 並び替え
    const sorted = [...result].sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "name") {
        av = a.name || "";
        bv = b.name || "";
        return sortAsc
          ? String(av).localeCompare(String(bv), "ja")
          : String(bv).localeCompare(String(av), "ja");
      }
      if (sortKey === "rent") {
        av = stats(a).totalRent;
        bv = stats(b).totalRent;
      } else if (sortKey === "occupancy") {
        av = stats(a).occupancyRate;
        bv = stats(b).occupancyRate;
      } else if (sortKey === "units") {
        av = stats(a).unitCount;
        bv = stats(b).unitCount;
      } else {
        // built_year（未設定は末尾へ）
        av = a.built_year || (sortAsc ? Infinity : -Infinity);
        bv = b.built_year || (sortAsc ? Infinity : -Infinity);
      }
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return sorted;
  }, [properties, filter, ownerFilter, occupancyFilter, sortKey, sortAsc]);

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "";

  return (
    <>
      <div className="toolbar">
        <div className="tb-tabs">
          {visibleTabs.map((tab) => (
            <span
              key={tab.key}
              className={`tb-tab${filter === tab.key ? " is-active" : ""}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}<span className="c">{totals[tab.key]}</span>
            </span>
          ))}
        </div>
        <div className="tb-actions">
          {/* フィルタ */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false); }}
              style={filterActive ? { color: "var(--accent)", borderColor: "var(--accent)" } : undefined}
            >
              <SlidersHorizontal size={14} style={{ marginRight: 4 }} />
              フィルタ{filterActive ? " •" : ""}
            </button>
            {filterOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setFilterOpen(false)} />
                <div className="card" style={{
                  position: "absolute", right: 0, top: "100%", marginTop: 6, zIndex: 50,
                  width: 240, padding: 14, boxShadow: "0 4px 16px rgba(40,32,12,.12)"
                }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>オーナー</label>
                  <select className="input" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                    <option value="all">すべて</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-2)", margin: "12px 0 4px" }}>入居状況</label>
                  <select className="input" value={occupancyFilter} onChange={(e) => setOccupancyFilter(e.target.value as OccupancyFilter)}>
                    <option value="all">すべて</option>
                    <option value="has_vacancy">空室あり</option>
                    <option value="full">満室</option>
                  </select>
                  {filterActive && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: 12, width: "100%" }}
                      onClick={() => { setOwnerFilter("all"); setOccupancyFilter("all"); }}
                    >
                      条件をクリア
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 並び替え */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false); }}
            >
              <ArrowUpDown size={14} style={{ marginRight: 4 }} />
              {sortLabel}{sortAsc ? " ↑" : " ↓"}
            </button>
            {sortOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setSortOpen(false)} />
                <div className="card" style={{
                  position: "absolute", right: 0, top: "100%", marginTop: 6, zIndex: 50,
                  width: 180, padding: 6, boxShadow: "0 4px 16px rgba(40,32,12,.12)"
                }}>
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => {
                        // 同じ項目を再選択したら昇順/降順をトグル
                        if (sortKey === o.key) setSortAsc((v) => !v);
                        else { setSortKey(o.key); setSortAsc(true); }
                        setSortOpen(false);
                      }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 8, padding: "8px 10px", fontSize: 13, color: "var(--ink-2)",
                        borderRadius: "var(--r-sm)", background: sortKey === o.key ? "var(--bg-2)" : "",
                      }}
                    >
                      <span>{o.label}</span>
                      {sortKey === o.key && (
                        <span style={{ display: "flex", alignItems: "center", gap: 2, color: "var(--accent)" }}>
                          <Check size={13} />{sortAsc ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="prop-grid">
        {filtered.map((prop) => (
          <PropertyCard key={prop.id} property={prop} owners={owners} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 16px", color: "var(--ink-3)" }}>
            該当する物件がありません
          </div>
        )}
      </div>
    </>
  );
}
