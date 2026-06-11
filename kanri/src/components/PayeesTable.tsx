"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import FilterableTable from "./FilterableTable";
import PayeeFormModal from "./PayeeFormModal";
import { usePermission } from "@/lib/use-permission";
import { useConfirm, useNotify } from "@/lib/confirm-context";
import { formatPhone } from "@/lib/phone";

const CATEGORY_LABEL: Record<string, string> = {
  repair: "修繕業者",
  cleaning: "クリーニング業者",
  insurance: "保険会社",
  other: "その他",
};

interface PayeesTableProps {
  payees: Record<string, any>[];
}

export default function PayeesTable({ payees }: PayeesTableProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const notify = useNotify();
  const [editData, setEditData] = useState<Record<string, any> | null>(null);
  const canEdit = usePermission("expenses:edit");
  const canDelete = usePermission("expenses:delete");

  async function handleDelete(id: string, name: string) {
    if (!(await confirm({ title: `「${name}」を削除しますか？`, variant: "danger", confirmLabel: "削除する" }))) return;
    const res = await fetch(`/api/payees/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else notify({ title: "削除に失敗しました" });
  }

  return (
    <>
      <FilterableTable
        data={payees}
        searchFields={["name", "name_kana", "bank_name", "phone"]}
        searchPlaceholder="取引先名・銀行で検索..."
        emptyMessage="支払先が登録されていません"
        columns={[
          {
            key: "name",
            label: "取引先名",
            sortable: true,
            render: (p) => (
              <span className="strong">
                {p.name}
                {p.name_kana && <span className="text-ink-3 text-xs ml-2">({p.name_kana})</span>}
              </span>
            ),
          },
          {
            key: "category",
            label: "カテゴリ",
            render: (p) => <span style={{ color: "var(--ink-2)" }}>{CATEGORY_LABEL[p.category] ?? p.category}</span>,
          },
          {
            key: "bank_name",
            label: "銀行",
            render: (p) =>
              p.bank_name ? (
                <span style={{ color: "var(--ink-2)" }}>{`${p.bank_name} ${p.branch_name || ""}`}</span>
              ) : (
                <span className="text-ink-3">—</span>
              ),
          },
          {
            key: "account_number",
            label: "口座番号",
            render: (p) =>
              p.account_number ? (
                <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>
                  {p.account_type === "current" ? "当座" : "普通"} {p.account_number}
                  {p.account_holder_kana && <span className="text-ink-3 ml-1 text-xs">({p.account_holder_kana})</span>}
                </span>
              ) : (
                <span className="text-ink-3">—</span>
              ),
          },
          {
            key: "phone",
            label: "電話",
            render: (p) => (
              <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{formatPhone(p.phone) || "—"}</span>
            ),
          },
        ]}
        actions={(p) => (
          <div className="flex items-center gap-2 justify-end">
            {canEdit && (
              <button onClick={() => setEditData(p)} className="text-ink-3 hover:text-accent transition-colors">
                <Pencil size={14} />
              </button>
            )}
            {canDelete && (
              <button onClick={() => handleDelete(p.id, p.name)} className="text-ink-3 hover:text-danger transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      />

      <PayeeFormModal
        isOpen={editData !== null}
        onClose={() => setEditData(null)}
        editData={editData}
      />
    </>
  );
}
