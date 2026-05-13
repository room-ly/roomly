"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import UnitFormModal from "./UnitFormModal";

interface UnitDetailClientProps {
  propertyId: string;
  unit: Record<string, any>;
}

export default function UnitDetailClient({
  propertyId,
  unit,
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
      <div className="flex items-center gap-2">
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-secondary inline-flex items-center gap-1.5"
        >
          <Pencil size={13} />
          編集
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn bg-danger-tint text-danger hover:bg-danger/10 inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Trash2 size={13} />
          {deleting ? "削除中..." : "削除"}
        </button>
      </div>

      <UnitFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        propertyId={propertyId}
        editData={unit}
      />
    </>
  );
}
