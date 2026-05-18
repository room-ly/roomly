"use client";

import { useState, useMemo } from "react";
import PropertyCard from "./PropertyCard";

interface Owner {
  id: string;
  name: string;
}

interface PropertiesGridProps {
  properties: Record<string, any>[];
  owners: Owner[];
}

type FilterKey = "all" | "apartment" | "apart" | "house" | "parking" | "land";

const TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "apartment", label: "マンション" },
  { key: "apart", label: "アパート" },
  { key: "house", label: "戸建て" },
  { key: "parking", label: "駐車場" },
  { key: "land", label: "土地" },
];

export default function PropertiesGrid({ properties, owners }: PropertiesGridProps) {
  const [filter, setFilter] = useState<FilterKey>("all");

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

  const filtered = useMemo(() => {
    if (filter === "all") return properties;
    return properties.filter((p) => p.property_type === filter);
  }, [properties, filter]);

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
          <button className="btn btn-ghost btn-sm">フィルタ</button>
          <button className="btn btn-ghost btn-sm">並び替え</button>
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
