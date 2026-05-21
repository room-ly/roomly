"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MonthSelector from "./MonthSelector";
import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";

interface InquiriesTableProps {
  inquiries: Record<string, any>[];
  initialFilter?: string;
}

const TYPE_LABELS: Record<string, string> = {
  move_out: "退去",
  complaint: "クレーム",
  other: "その他",
  general: "その他",
  noise: "騒音",
  facility: "設備",
};

function getAvailableMonths(data: Record<string, any>[]): string[] {
  const set = new Set<string>();
  for (const item of data) {
    if (item.created_at) set.add(item.created_at.slice(0, 7));
  }
  return Array.from(set).sort().reverse();
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function InquiriesTable({ inquiries, initialFilter }: InquiriesTableProps) {
  const router = useRouter();

  const availableMonths = useMemo(() => getAvailableMonths(inquiries), [inquiries]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const current = getCurrentMonth();
    return availableMonths.includes(current) ? current : availableMonths[0] || current;
  });

  const monthFiltered = useMemo(() => {
    if (selectedMonth === "all") return inquiries;
    return inquiries.filter((q) => q.created_at?.startsWith(selectedMonth));
  }, [inquiries, selectedMonth]);

  return (
    <>
      <MonthSelector selectedMonth={selectedMonth} availableMonths={availableMonths} onChange={setSelectedMonth} />

      <FilterableTable
        data={monthFiltered}
        searchFields={["title", "tenant.name", "property.name"]}
        searchPlaceholder="件名・入居者名で検索..."
        initialFilters={initialFilter === "open" ? { status: "open" } : {}}
        filters={[
          {
            key: "status",
            label: "状態",
            options: [
              { value: "open", label: "未対応" },
              { value: "in_progress", label: "対応中" },
              { value: "resolved", label: "完了" },
              { value: "closed", label: "クローズ" },
            ],
          },
          {
            key: "priority",
            label: "優先度",
            options: [
              { value: "urgent", label: "緊急" },
              { value: "high", label: "高" },
              { value: "normal", label: "通常" },
              { value: "low", label: "低" },
            ],
          },
        ]}
        columns={[
          {
            key: "title",
            label: "件名",
            sortable: true,
            render: (item) => <span className="strong">{item.title}</span>,
          },
          {
            key: "tenant.name",
            label: "入居者",
            render: (item) => <span style={{ color: "var(--ink-2)" }}>{item.tenant?.name || "—"}</span>,
          },
          {
            key: "property.name",
            label: "物件",
            render: (item) => (
              <span style={{ color: "var(--ink-2)" }}>
                {item.property?.name || "—"}
                {item.unit?.unit_number ? ` #${item.unit.unit_number}` : ""}
              </span>
            ),
          },
          {
            key: "inquiry_type",
            label: "種別",
            render: (item) => (
              <span style={{ color: "var(--ink-3)" }}>
                {TYPE_LABELS[item.inquiry_type] || item.inquiry_type}
              </span>
            ),
          },
          {
            key: "priority",
            label: "優先度",
            render: (item) => <StatusBadge status={item.priority} />,
          },
          {
            key: "status",
            label: "状態",
            render: (item) => <StatusBadge status={item.status} />,
          },
          {
            key: "created_at",
            label: "受付日",
            sortable: true,
            render: (item) => (
              <span className="mono" style={{ color: "var(--ink-3)" }}>
                {item.created_at?.slice(0, 10) || "—"}
              </span>
            ),
          },
        ]}
        onRowClick={(item) => router.push(`/inquiries/${item.id}`)}
        rowClassName={(item) => item.priority === "urgent" ? "bg-danger-tint" : ""}
      />
    </>
  );
}
