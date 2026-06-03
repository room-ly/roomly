"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import RemittanceFormModal from "./RemittanceFormModal";
import { usePermission } from "@/lib/use-permission";
import { useConfirm, useNotify } from "@/lib/confirm-context";

interface OwnerOption {
  id: string;
  label: string;
}

interface RemittanceDetailClientProps {
  remittance: Record<string, any>;
  owners: OwnerOption[];
}

export default function RemittanceDetailClient({ remittance, owners }: RemittanceDetailClientProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const notify = useNotify();
  const [modalOpen, setModalOpen] = useState(false);
  const canEdit = usePermission("remittances:edit");
  const canDelete = usePermission("remittances:delete");

  async function handleDelete() {
    if (!(await confirm({ title: "この送金データを削除しますか？", variant: "danger", confirmLabel: "削除する" }))) return;
    const res = await fetch(`/api/remittances/${remittance.id}`, { method: "DELETE" });
    if (res.ok) router.push("/remittances");
    else notify({ title: "削除に失敗しました" });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && (
          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-secondary flex items-center gap-1.5 text-[13px]"
          >
            <Pencil size={13} />
            編集
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            className="p-2 rounded text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <RemittanceFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        owners={owners.map((o) => ({ id: o.id, name: o.label }))}
        editData={remittance}
      />
    </>
  );
}
