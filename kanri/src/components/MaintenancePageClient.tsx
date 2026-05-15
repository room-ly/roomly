"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import MaintenanceFormModal from "./MaintenanceFormModal";

interface SelectOption {
  id: string;
  label: string;
}

interface MaintenancePageClientProps {
  properties: SelectOption[];
}

export default function MaintenancePageClient({
  properties,
}: MaintenancePageClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={14} />
        依頼を登録
      </button>
      <MaintenanceFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        properties={properties}
      />
    </>
  );
}
