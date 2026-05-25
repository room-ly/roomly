"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, FileText } from "lucide-react";
import UnitFormModal from "./UnitFormModal";

interface UnitDetailClientProps {
  propertyId: string;
  unit: Record<string, any>;
  activeContract?: Record<string, any> | null;
}

export default function UnitDetailClient({
  propertyId,
  unit,
  activeContract,
}: UnitDetailClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("この部屋を削除しますか？")) return;
    setDeleting(true);
    const res = await fetch(`/api/units/${unit.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/properties/${propertyId}`);
      router.refresh();
    }
    setDeleting(false);
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        {activeContract && (
          <button
            onClick={() => window.open(`/api/contracts/${activeContract.id}/move-out-notice`, "_blank")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-ink-2 bg-bg-2 rounded-lg hover:bg-bg-3 transition-colors"
          >
            <FileText size={14} />
            退去届
          </button>
        )}
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-ink-2 bg-bg-2 rounded-lg hover:bg-bg-3 transition-colors"
        >
          <Pencil size={14} />
          編集
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-danger bg-danger-tint rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          {deleting ? "削除中..." : "削除"}
        </button>
      </div>

      <UnitFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        propertyId={propertyId}
        propertyType={unit.property?.property_type}
        editData={unit}
      />
    </>
  );
}
