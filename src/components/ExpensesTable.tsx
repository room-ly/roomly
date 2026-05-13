"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";
import RowMenu from "./RowMenu";
import ExpenseFormModal from "./ExpenseFormModal";

interface SelectOption {
  id: string;
  label: string;
  owner_id?: string;
}

interface ExpensesTableProps {
  data: Record<string, any>[];
  properties: SelectOption[];
  owners: SelectOption[];
}

export default function ExpensesTable({ data, properties, owners }: ExpensesTableProps) {
  const router = useRouter();
  const [editData, setEditData] = useState<Record<string, any> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete(item: Record<string, any>) {
    if (!confirm(`この経費を削除しますか？`)) return;
    const res = await fetch(`/api/expenses/${item.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("削除に失敗しました");
  }

  return (
    <>
      <FilterableTable
        data={data}
        searchFields={["description", "property.name"]}
        searchPlaceholder="内容・物件名で検索..."
        filters={[
          {
            key: "category",
            label: "カテゴリ",
            options: [
              { value: "repair", label: "修繕費" },
              { value: "cleaning", label: "清掃費" },
              { value: "insurance", label: "保険料" },
              { value: "tax", label: "税金" },
              { value: "utility", label: "光熱費" },
              { value: "other", label: "その他" },
            ],
          },
          {
            key: "is_owner_charge",
            label: "負担区分",
            options: [
              { value: "true", label: "オーナー負担" },
              { value: "false", label: "管理会社負担" },
            ],
          },
        ]}
        columns={[
          { key: "expense_date", label: "日付", sortable: true },
          { key: "category", label: "カテゴリ", render: (item) => <StatusBadge status={item.category} /> },
          { key: "description", label: "内容", render: (item) => <span className="font-medium">{item.description}</span> },
          { key: "property.name", label: "物件", render: (item) => <span className="text-ink-2">{item.property?.name || "—"}</span> },
          { key: "unit.unit_number", label: "部屋", render: (item) => item.unit?.unit_number || "—" },
          {
            key: "amount",
            label: "金額",
            align: "right" as const,
            sortable: true,
            render: (item) => <span className="font-medium tabular-nums">¥{Number(item.amount).toLocaleString()}</span>,
          },
          {
            key: "is_owner_charge",
            label: "負担",
            render: (item) => (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  item.is_owner_charge ? "text-warn" : "text-accent"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${item.is_owner_charge ? "bg-warn" : "bg-accent"}`} />
                {item.is_owner_charge ? "オーナー" : "管理会社"}
              </span>
            ),
          },
        ]}
        actions={(item) => (
          <RowMenu
            onEdit={() => { setEditData(item); setModalOpen(true); }}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      <ExpenseFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        properties={properties}
        owners={owners}
        editData={editData}
      />
    </>
  );
}
