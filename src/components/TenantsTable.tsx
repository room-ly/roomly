"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FilterableTable from "./FilterableTable";
import RowMenu from "./RowMenu";
import TenantFormModal from "./TenantFormModal";

interface TenantsTableProps {
  data: Record<string, any>[];
}

export default function TenantsTable({ data }: TenantsTableProps) {
  const router = useRouter();
  const [editData, setEditData] = useState<Record<string, any> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete(item: Record<string, any>) {
    if (!confirm(`「${item.name}」を削除しますか？`)) return;
    const res = await fetch(`/api/tenants/${item.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("削除に失敗しました");
  }

  return (
    <>
      <FilterableTable
        data={data}
        searchFields={["name", "name_kana", "phone", "email"]}
        searchPlaceholder="名前・電話番号・メールで検索..."
        columns={[
          { key: "name", label: "名前", sortable: true, render: (item) => <span className="font-medium">{item.name}</span> },
          { key: "name_kana", label: "フリガナ", render: (item) => <span className="text-ink-3">{item.name_kana || "—"}</span> },
          { key: "phone", label: "電話番号" },
          { key: "email", label: "メール", render: (item) => <span className="text-ink-3">{item.email || "—"}</span> },
          { key: "workplace", label: "勤務先", render: (item) => <span className="text-ink-3">{item.workplace || "—"}</span> },
          {
            key: "contract.unit.property.name",
            label: "物件・部屋",
            render: (item) =>
              item.contract?.unit ? (
                <span>{item.contract.unit.property?.name} {item.contract.unit.unit_number}</span>
              ) : (
                <span className="text-ink-3">—</span>
              ),
          },
          {
            key: "contract.rent",
            label: "賃料",
            align: "right" as const,
            sortable: true,
            render: (item) => (
              <span className="font-medium tabular-nums">
                {item.contract ? `¥${Number(item.contract.rent).toLocaleString()}` : "—"}
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

      <TenantFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        editData={editData}
      />
    </>
  );
}
