"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import CaseFormModal from "./CaseFormModal";

interface SelectOption {
  id: string;
  label: string;
}

interface CasesPageClientProps {
  properties: SelectOption[];
}

export default function CasesPageClient({
  properties,
}: CasesPageClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={14} />
        対応案件を登録
      </button>
      <CaseFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        properties={properties}
      />
    </>
  );
}
