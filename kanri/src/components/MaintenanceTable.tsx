"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

interface MaintenanceTableProps {
  data: Record<string, any>[];
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

export default function MaintenanceTable({ data }: MaintenanceTableProps) {
  const router = useRouter();

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

  return (
    <>
      <MonthSelector selectedMonth={selectedMonth} availableMonths={availableMonths} onChange={setSelectedMonth} />

      <FilterableTable
        data={sorted}
        searchFields={["title", "property.name", "vendor_name"]}
        searchPlaceholder="件名・物件名で検索..."
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
          { key: "title", label: "件名", sortable: true, render: (item) => <span className="font-medium">{item.title}</span> },
          { key: "property.name", label: "物件", render: (item) => <span className="text-ink-2">{item.property?.name}</span> },
          { key: "unit.unit_number", label: "部屋", render: (item) => item.unit?.unit_number || "共用部" },
          { key: "category", label: "カテゴリ", render: (item) => <span className="text-ink-2">{categoryLabels[item.category] || item.category}</span> },
          { key: "priority", label: "優先度", render: (item) => <StatusBadge status={item.priority} /> },
          { key: "status", label: "状態", render: (item) => <StatusBadge status={item.status} /> },
          { key: "reported_date", label: "報告日", sortable: true },
          { key: "vendor_name", label: "業者", render: (item) => <span className="text-ink-2">{item.vendor_name || "—"}</span> },
          {
            key: "estimated_cost",
            label: "見積",
            align: "right" as const,
            render: (item) => (
              <span className="tabular-nums">
                {item.estimated_cost ? `¥${Number(item.estimated_cost).toLocaleString()}` : "—"}
              </span>
            ),
          },
        ]}
        onRowClick={(item) => router.push(`/maintenance/${item.id}`)}
        rowClassName={(item) => item.priority === "urgent" ? "bg-danger-tint" : ""}
      />
    </>
  );
}
