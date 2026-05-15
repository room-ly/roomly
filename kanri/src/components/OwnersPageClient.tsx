"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import OwnerFormModal from "./OwnerFormModal";

export default function OwnersPageClient() {
  const [isOpen, setIsOpen] = useState(false);

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
