"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import TenantFormModal from "./TenantFormModal";
import { usePermission } from "@/lib/use-permission";

interface TenantDetailClientProps {
  tenant: Record<string, any>;
}

export default function TenantDetailClient({ tenant }: TenantDetailClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const canEdit = usePermission("tenants:edit");
  const canDelete = usePermission("tenants:delete");

  async function handleDelete() {
    if (!confirm(`「${tenant.name}」を削除しますか？`)) return;
    const res = await fetch(`/api/tenants/${tenant.id}`, { method: "DELETE" });
    if (res.ok) router.push("/tenants");
    else alert("削除に失敗しました");
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

      <TenantFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editData={tenant}
      />
    </>
  );
}
