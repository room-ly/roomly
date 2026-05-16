"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MonthSelector from "./MonthSelector";
import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";

const categoryLabels: Record<string, string> = {
  plumbing: "水回り",
  electrical: "電気",
  structural: "構造",
  equipment: "設備",
  other: "その他",
};

const KANBAN_COLS = [
  { key: "pending", label: "未対応", tone: "warn" },
  { key: "in_progress", label: "対応中", tone: "info" },
  { key: "waiting_parts", label: "部品待ち", tone: "neutral" },
  { key: "completed", label: "完了", tone: "accent" },
] as const;

interface MaintenanceTableProps {
  data: Record<string, any>[];
  initialFilter?: string;
}

function getAvailableMonths(data: Record<string, any>[]): string[] {
  const set = new Set<string>();
  for (const item of data) {
    if (item.reported_date) set.add(item.reported_date.slice(0, 7));
  }
  return Array.from(set).sort().reverse();
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function MaintenanceTable({ data, initialFilter }: MaintenanceTableProps) {
  const router = useRouter();
  const [view, setView] = useState<"kanban" | "table">("kanban");

  const availableMonths = useMemo(() => getAvailableMonths(data), [data]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const current = getCurrentMonth();
    return availableMonths.includes(current) ? current : availableMonths[0] || current;
  });

  const monthFiltered = useMemo(() => {
    if (selectedMonth === "all") return data;
    return data.filter((m) => m.reported_date?.startsWith(selectedMonth));
  }, [data, selectedMonth]);

  const sorted = useMemo(() => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    return [...monthFiltered].sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));
  }, [monthFiltered]);

  const byStatus = useMemo(() => {
    const map: Record<string, Record<string, any>[]> = {};
    for (const col of KANBAN_COLS) map[col.key] = [];
    for (const item of sorted) {
      const key = item.status || "pending";
      if (map[key]) map[key].push(item);
      else map.pending.push(item);
    }
    return map;
  }, [sorted]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <MonthSelector selectedMonth={selectedMonth} availableMonths={availableMonths} onChange={setSelectedMonth} />
        <div className="tn-viewbar-tabs" style={{ marginLeft: "auto" }}>
          <button
            className={`tn-viewbar-tab${view === "kanban" ? " is-active" : ""}`}
            onClick={() => setView("kanban")}
          >
            カンバン
          </button>
          <button
            className={`tn-viewbar-tab${view === "table" ? " is-active" : ""}`}
            onClick={() => setView("table")}
          >
            テーブル
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="kanban">
          {KANBAN_COLS.map((col) => (
            <div key={col.key} className="kb-col">
              <div className="kb-col-head">
                <span className={`tag ${col.tone}`}>{col.label}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>{byStatus[col.key].length}</span>
              </div>
              {byStatus[col.key].length === 0 ? (
                <div className="tn-board-empty">該当なし</div>
              ) : (
                byStatus[col.key].map((item) => (
                  <Link key={item.id} href={`/maintenance/${item.id}`} className="kb-card">
                    <div className="kb-card-prio">
                      <StatusBadge status={item.priority} />
                      {item.category && (
                        <span style={{ fontSize: 10, color: "var(--ink-4)" }}>
                          {categoryLabels[item.category] || item.category}
                        </span>
                      )}
                    </div>
                    <div className="kb-card-title">{item.title}</div>
                    <div className="kb-card-prop">{item.property?.name} {item.unit?.unit_number || "共用部"}</div>
                    <div className="kb-card-foot">
                      <span className="mono">{item.reported_date}</span>
                      <span>{item.vendor_name || "業者未定"}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          ))}
        </div>
      ) : (
        <FilterableTable
          data={sorted}
          searchFields={["title", "property.name", "vendor_name"]}
          searchPlaceholder="件名・物件名で検索..."
          initialFilters={initialFilter === "pending" ? { status: "pending" } : {}}
          filters={[
            {
              key: "status",
              label: "状態",
              options: [
                { value: "pending", label: "未対応" },
                { value: "in_progress", label: "対応中" },
                { value: "completed", label: "完了" },
                { value: "cancelled", label: "キャンセル" },
              ],
            },
          ]}
          columns={[
            { key: "title", label: "件名", sortable: true, render: (item) => <span className="strong">{item.title}</span> },
            { key: "property.name", label: "物件", render: (item) => <span style={{ color: "var(--ink-2)" }}>{item.property?.name}</span> },
            { key: "unit.unit_number", label: "部屋", render: (item) => item.unit?.unit_number || "共用部" },
            { key: "category", label: "カテゴリ", render: (item) => <span style={{ color: "var(--ink-2)" }}>{categoryLabels[item.category] || item.category}</span> },
            { key: "priority", label: "優先度", render: (item) => <StatusBadge status={item.priority} /> },
            { key: "status", label: "状態", render: (item) => <StatusBadge status={item.status} /> },
            { key: "reported_date", label: "報告日", sortable: true },
            { key: "vendor_name", label: "業者", render: (item) => <span style={{ color: "var(--ink-2)" }}>{item.vendor_name || "—"}</span> },
            {
              key: "estimated_cost",
              label: "見積",
              align: "right" as const,
              render: (item) => (
                <span className="num">
                  {item.estimated_cost ? `¥${Number(item.estimated_cost).toLocaleString()}` : "—"}
                </span>
              ),
            },
          ]}
          onRowClick={(item) => router.push(`/maintenance/${item.id}`)}
          rowClassName={(item) => item.priority === "urgent" ? "bg-danger-tint" : ""}
        />
      )}
    </>
  );
}
