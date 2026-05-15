"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import MaintenanceFormModal from "./MaintenanceFormModal";

interface SelectOption {
  id: string;
  label: string;
}

interface MaintenanceDetailClientProps {
  request: Record<string, any>;
  properties: SelectOption[];
}

export default function MaintenanceDetailClient({ request, properties }: MaintenanceDetailClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete() {
    if (!confirm("この修繕依頼を削除しますか？")) return;
    const res = await fetch(`/api/maintenance/${request.id}`, { method: "DELETE" });
    if (res.ok) router.push("/maintenance");
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

      <MaintenanceFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        properties={properties}
        editData={request}
      />
    </>
  );
}
