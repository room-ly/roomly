"use client";

import { useRouter } from "next/navigation";
import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";

interface InquiriesTableProps {
  inquiries: Record<string, any>[];
}

export default function InquiriesTable({ inquiries }: InquiriesTableProps) {
  const router = useRouter();

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <FilterableTable
      data={inquiries}
      searchFields={["title"]}
      searchPlaceholder="件名で検索..."
      filters={[
        {
          key: "status",
          label: "状態",
          options: [
            { value: "open", label: "未対応" },
            { value: "in_progress", label: "対応中" },
            { value: "resolved", label: "対応済み" },
            { value: "closed", label: "完了" },
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
        { key: "title", label: "件名", render: (item) => <span className="font-medium">{item.title}</span> },
        { key: "inquiry_type", label: "種別", render: (item) => <StatusBadge status={item.inquiry_type} /> },
        { key: "priority", label: "優先度", render: (item) => <StatusBadge status={item.priority} /> },
        {
          key: "status",
          label: "状態",
          render: (item) => (
            <select
              value={item.status}
              onChange={(e) => updateStatus(item.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="text-[12px] rounded border border-border-light px-2 py-1 bg-card"
            >
              <option value="open">未対応</option>
              <option value="in_progress">対応中</option>
              <option value="resolved">対応済み</option>
              <option value="closed">完了</option>
            </select>
          ),
        },
        { key: "created_at", label: "登録日", sortable: true, render: (item) => item.created_at?.slice(0, 10) },
      ]}
    />
  );
}
