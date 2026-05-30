"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import CaseFormModal from "./CaseFormModal";
import { usePermission } from "@/lib/use-permission";

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
  const canCreate = usePermission("cases:create");

  if (!canCreate) return null;

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
