"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import ContractFormModal from "./ContractFormModal";

interface SelectOption {
  id: string;
  label: string;
}

interface ContractDetailClientProps {
  contract: Record<string, any>;
  units: SelectOption[];
  tenants: SelectOption[];
}

export default function ContractDetailClient({ contract, units, tenants }: ContractDetailClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete() {
    if (!confirm("この契約を削除しますか？")) return;
    const res = await fetch(`/api/contracts/${contract.id}`, { method: "DELETE" });
    if (res.ok) router.push("/contracts");
    else alert("削除に失敗しました");
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-secondary flex items-center gap-1.5 text-[13px]"
        >
          <Pencil size={13} />
          編集
        </button>
        <button
          onClick={handleDelete}
          className="p-2 rounded text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <ContractFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        units={units}
        tenants={tenants}
        editData={contract}
      />
    </>
  );
}
