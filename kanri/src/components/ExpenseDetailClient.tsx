"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import ExpenseFormModal from "./ExpenseFormModal";

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
  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete() {
    if (!confirm("この経費を削除しますか？")) return;
    const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
    if (res.ok) router.push("/expenses");
    else alert("削除に失敗しました");
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-secondary flex items-center gap-1.5 text-[13px]"
        >
          <Pencil size={13} />
          編集
        </button>
        <button
          onClick={handleDelete}
          className="p-2 rounded text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <ExpenseFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        properties={properties}
        owners={owners}
        editData={expense}
      />
    </>
  );
}
