"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import OwnerFormModal from "./OwnerFormModal";
import { usePermission } from "@/lib/use-permission";

export default function OwnersPageClient() {
  const [isOpen, setIsOpen] = useState(false);
  const canCreate = usePermission("owners:create");

  if (!canCreate) return null;

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        <Plus size={14} />
        オーナーを追加
      </button>
      <OwnerFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
