"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import UnitFormModal from "./UnitFormModal";
import PropertyFormModal from "./PropertyFormModal";

interface Owner {
  id: string;
  name: string;
}

interface PropertyDetailClientProps {
  propertyId: string;
  property: Record<string, any>;
  owners: Owner[];
}

export default function PropertyDetailClient({
  propertyId,
  property,
  owners,
}: PropertyDetailClientProps) {
  const router = useRouter();
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);

  async function deleteProperty() {
    if (!confirm("この物件を削除しますか？関連する部屋も全て削除されます。")) return;
    const res = await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/properties");
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPropertyModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] text-text-secondary bg-bg-secondary rounded-lg hover:bg-border-light transition-colors"
        >
          <Pencil size={13} />
          編集
        </button>
        <button
          onClick={deleteProperty}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] text-danger bg-danger-bg rounded-lg hover:bg-danger/10 transition-colors"
        >
          <Trash2 size={13} />
          削除
        </button>
        <button className="btn-primary" onClick={() => setUnitModalOpen(true)}>
          <Plus size={14} />
          部屋を追加
        </button>
      </div>

      <UnitFormModal
        isOpen={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        propertyId={propertyId}
      />
      <PropertyFormModal
        isOpen={propertyModalOpen}
        onClose={() => setPropertyModalOpen(false)}
        owners={owners}
        editData={property}
      />
    </>
  );
}
