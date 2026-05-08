"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import UnitFormModal from "./UnitFormModal";

interface PropertyDetailClientProps {
  propertyId: string;
}

export default function PropertyDetailClient({
  propertyId,
}: PropertyDetailClientProps) {
  const [unitModalOpen, setUnitModalOpen] = useState(false);

  return (
    <>
      <button className="btn-primary" onClick={() => setUnitModalOpen(true)}>
        <Plus size={14} />
        部屋を追加
      </button>

      <UnitFormModal
        isOpen={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        propertyId={propertyId}
      />
    </>
  );
}
