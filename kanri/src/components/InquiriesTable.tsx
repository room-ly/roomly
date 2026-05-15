"use client";

import { useRouter } from "next/navigation";
import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";

interface InquiriesTableProps {
  inquiries: Record<string, any>[];
}

const TYPE_LABELS: Record<string, string> = {
  move_out: "退去",
  complaint: "クレーム",
  other: "その他",
  general: "その他",
  noise: "クレーム",
  facility: "その他",
};

export default function InquiriesTable({ inquiries }: InquiriesTableProps) {
  const router = useRouter();

  return (
    <FilterableTable
      data={inquiries}
      searchFields={["title", "property.name", "tenant.name"]}
      searchPlaceholder="件名・物件名・入居者名で検索..."
      filters={[
        {
          key: "status",
          label: "状態",
          options: [
            { value: "open", label: "未対応" },
            { value: "in_progress", label: "対応中" },
            { value: "resolved", label: "対応済み" },
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
          key: "status",
          label: "状態",
          render: (item) => <StatusBadge status={item.status} />,
        },
        {
          key: "title",
          label: "件名",
          render: (item) => <span className="font-medium">{item.title}</span>,
        },
        {
          key: "property.name",
          label: "物件・部屋",
          render: (item) => {
            const propName = item.property?.name;
            const unitNum = item.unit?.unit_number;
            if (!propName && !unitNum) return <span className="text-ink-3">—</span>;
            return <span>{propName}{unitNum ? ` ${unitNum}` : ""}</span>;
          },
        },
        {
          key: "tenant.name",
          label: "入居者",
          render: (item) => {
            const name = item.tenant?.name;
            if (!name) return <span className="text-ink-3">—</span>;
            return <span>{name}</span>;
          },
        },
        {
          key: "inquiry_type",
          label: "種別",
          render: (item) => <span className="text-ink-2">{TYPE_LABELS[item.inquiry_type] || item.inquiry_type}</span>,
        },
        {
          key: "priority",
          label: "優先度",
          render: (item) => <StatusBadge status={item.priority} />,
        },
        { key: "created_at", label: "登録日", sortable: true, render: (item) => item.created_at?.slice(0, 10) },
      ]}
      onRowClick={(item) => router.push(`/inquiries/${item.id}`)}
    />
  );
}
