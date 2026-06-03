"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import ExpenseFormModal from "./ExpenseFormModal";
import ConfirmDialog from "./ConfirmDialog";
import { usePermission } from "@/lib/use-permission";
import { useNotify } from "@/lib/confirm-context";

interface SelectOption {
  id: string;
  label: string;
  owner_id?: string;
}

interface ExpenseDetailClientProps {
  expense: Record<string, any>;
  properties: SelectOption[];
  owners: SelectOption[];
}

export default function ExpenseDetailClient({ expense, properties, owners }: ExpenseDetailClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const canEdit = usePermission("expenses:edit");
  const canDelete = usePermission("expenses:delete");

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
    if (res.ok) router.push("/expenses");
    else { notify({ title: "削除に失敗しました" }); setDeleting(false); }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && (
          <button onClick={() => setModalOpen(true)} className="btn btn-secondary flex items-center gap-1.5 text-[13px]">
            <Pencil size={13} /> 編集
          </button>
        )}
        {canDelete && (
          <button onClick={() => setDeleteOpen(true)} className="p-2 rounded text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <ExpenseFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} properties={properties} owners={owners} editData={expense} />
      <ConfirmDialog isOpen={deleteOpen} title="経費を削除" message="この経費データを削除しますか？復元できません。" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </>
  );
}
