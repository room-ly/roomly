"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import PayeeFormModal from "./PayeeFormModal";
import { usePermission } from "@/lib/use-permission";

export default function PayeesPageClient() {
  const [isOpen, setIsOpen] = useState(false);
  const canCreate = usePermission("expenses:create");

  if (!canCreate) return null;

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={14} />
        支払先を追加
      </button>
      <PayeeFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
