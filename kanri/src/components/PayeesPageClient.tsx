"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import PayeeFormModal from "./PayeeFormModal";
import { usePermission } from "@/lib/use-permission";

const CATEGORY_LABEL: Record<string, string> = {
  repair: "修繕業者",
  cleaning: "クリーニング業者",
  insurance: "保険会社",
  other: "その他",
};

interface PayeesPageClientProps {
  payees: Record<string, any>[];
}

export default function PayeesPageClient({ payees }: PayeesPageClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, any> | null>(null);
  const canCreate = usePermission("expenses:create");
  const canEdit = usePermission("expenses:edit");
  const canDelete = usePermission("expenses:delete");

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    const res = await fetch(`/api/payees/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("削除に失敗しました");
  }

  function openEdit(p: Record<string, any>) {
    setEditData(p);
    setIsOpen(true);
  }

  function openNew() {
    setEditData(null);
    setIsOpen(true);
  }

  return (
    <>
      {canCreate && (
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={14} />
          支払先を追加
        </button>
      )}

      {payees.length === 0 ? (
        <div className="card p-10 text-center text-ink-3 mt-4">
          支払先が登録されていません
        </div>
      ) : (
        <div className="card mt-4 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left px-4 py-3 font-medium text-ink-2">取引先名</th>
                <th className="text-left px-4 py-3 font-medium text-ink-2">カテゴリ</th>
                <th className="text-left px-4 py-3 font-medium text-ink-2">銀行</th>
                <th className="text-left px-4 py-3 font-medium text-ink-2">口座番号</th>
                <th className="text-left px-4 py-3 font-medium text-ink-2">電話</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payees.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {p.name}
                    {p.name_kana && <span className="text-ink-3 text-xs ml-2">({p.name_kana})</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-2">{CATEGORY_LABEL[p.category] ?? p.category}</td>
                  <td className="px-4 py-3 text-ink-2">
                    {p.bank_name ? `${p.bank_name} ${p.branch_name || ""}` : <span className="text-ink-3">—</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-2">
                    {p.account_number ? (
                      <>
                        {p.account_type === "current" ? "当座" : "普通"} {p.account_number}
                        {p.account_holder_kana && <span className="text-ink-3 ml-1 text-xs">({p.account_holder_kana})</span>}
                      </>
                    ) : <span className="text-ink-3">—</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-2">{p.phone || <span className="text-ink-3">—</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {canEdit && (
                        <button onClick={() => openEdit(p)} className="text-ink-3 hover:text-accent transition-colors">
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(p.id, p.name)} className="text-ink-3 hover:text-danger transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PayeeFormModal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setEditData(null); }}
        editData={editData}
      />
    </>
  );
}
