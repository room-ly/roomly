"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ExpenseFormModal from "./ExpenseFormModal";

interface SelectOption {
  id: string;
  label: string;
}

interface ExpensesPageClientProps {
  properties: SelectOption[];
  owners: SelectOption[];
  payees: SelectOption[];
}

export default function ExpensesPageClient({
  properties,
  owners,
  payees,
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
      />
    </>
  );
}
