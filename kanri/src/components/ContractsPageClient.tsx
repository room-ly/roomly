"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ContractFormModal from "./ContractFormModal";

interface SelectOption {
  id: string;
  label: string;
}

interface ContractsPageClientProps {
  units: SelectOption[];
  tenants: SelectOption[];
}

export default function ContractsPageClient({
  units,
  tenants,
}: ContractsPageClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="btn btn-accent" onClick={() => setIsOpen(true)}>
        <Plus size={14} />
        契約を作成
      </button>
      <ContractFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        units={units}
        tenants={tenants}
      />
    </>
  );
}
