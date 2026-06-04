"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ExpenseFormModal, { type CaseOption, type ContractOption } from "./ExpenseFormModal";
import { usePermission } from "@/lib/use-permission";

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
  cases?: CaseOption[];
  contracts?: ContractOption[];
}

export default function ExpensesPageClient({
  properties,
  owners,
  payees,
  cases = [],
  contracts = [],
}: ExpensesPageClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canCreate = usePermission("expenses:create");

  if (!canCreate) return null;

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={14} />
        費用を登録
      </button>
      <ExpenseFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        properties={properties}
        owners={owners}
        payees={payees}
        cases={cases}
        contracts={contracts}
      />
    </>
  );
}
