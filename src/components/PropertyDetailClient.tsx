"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import UnitFormModal from "./UnitFormModal";

interface PropertyDetailClientProps {
  propertyId: string;
}

export default function PropertyDetailClient({
  propertyId,
}: PropertyDetailClientProps) {
  const router = useRouter();
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleAddClick() {
    setChecking(true);
    try {
      const res = await fetch("/api/plan-check");
      const data = await res.json();
      if (data.isOver) {
        router.push("/settings");
        return;
      }
    } catch {
      // チェック失敗時はフォームを開く（API側で再チェックされる）
    } finally {
      setChecking(false);
    }
    setUnitModalOpen(true);
  }

  return (
    <>
      <button
        className="btn btn-primary disabled:opacity-50"
        onClick={handleAddClick}
        disabled={checking}
      >
        <Plus size={14} />
        {checking ? "確認中..." : "部屋を追加"}
      </button>

      <UnitFormModal
        isOpen={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        propertyId={propertyId}
      />
    </>
  );
}
