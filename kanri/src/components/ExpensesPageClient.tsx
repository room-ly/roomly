"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ExpenseFormModal, { type MaintenanceOption, type ContractOption } from "./ExpenseFormModal";

interface SelectOption {
  id: string;
  label: string;
  owner_id?: string;
  default_allocation_method?: string | null;
}

interface ExpensesPageClientProps {
  properties: SelectOption[];
  owners: SelectOption[];
  payees: SelectOption[];
  maintenance?: MaintenanceOption[];
  contracts?: ContractOption[];
}

export default function ExpensesPageClient({
  properties,
  owners,
  payees,
  maintenance = [],
  contracts = [],
}: ExpensesPageClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={14} />
        経費を登録
      </button>
      <ExpenseFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        properties={properties}
        owners={owners}
        payees={payees}
        maintenance={maintenance}
        contracts={contracts}
      />
    </>
  );
}
