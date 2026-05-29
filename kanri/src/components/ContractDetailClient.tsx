"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, FileText, FileCheck, RefreshCw } from "lucide-react";
import ContractFormModal from "./ContractFormModal";
import ConfirmDialog from "./ConfirmDialog";

interface SelectOption {
  id: string;
  label: string;
}

interface ContractDetailClientProps {
  contract: Record<string, any>;
  units: SelectOption[];
  tenants: SelectOption[];
  moveOutRequests?: Record<string, any>[];
}

export default function ContractDetailClient({ contract, units, tenants, moveOutRequests }: ContractDetailClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const latestMoveOut = moveOutRequests?.[0];
  const editData = {
    ...contract,
    move_out_date: contract.move_out_date || latestMoveOut?.desired_move_out_date || "",
  };

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/contracts/${contract.id}`, { method: "DELETE" });
    if (res.ok) router.push("/contracts");
    else { alert("削除に失敗しました"); setDeleting(false); }
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <a href={`/api/contracts/${contract.id}/contract-document`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex items-center gap-1.5 text-[13px]">
          <FileText size={13} /> 契約書
        </a>
        <a href={`/api/contracts/${contract.id}/important-explanation`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex items-center gap-1.5 text-[13px]">
          <FileCheck size={13} /> 重説
        </a>
        {contract.status === "active" && (
          <a href={`/api/contracts/${contract.id}/renewal-notice`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex items-center gap-1.5 text-[13px]" style={{ color: "var(--accent)" }}>
            <RefreshCw size={13} /> 更新案内
          </a>
        )}
        {contract.status === "active" && (
          <a href={`/api/contracts/${contract.id}/move-out-notice`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex items-center gap-1.5 text-[13px]" style={{ color: "var(--warn)" }}>
            <FileText size={13} /> 退去届
          </a>
        )}
        <button onClick={() => setModalOpen(true)} className="btn btn-secondary flex items-center gap-1.5 text-[13px]">
          <Pencil size={13} /> 編集
        </button>
        <button onClick={() => setDeleteOpen(true)} className="p-2 rounded text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      <ContractFormModal key={modalOpen ? "open" : "closed"} isOpen={modalOpen} onClose={() => setModalOpen(false)} units={units} tenants={tenants} editData={editData} />
      <ConfirmDialog isOpen={deleteOpen} title="契約を削除" message="この契約を削除しますか？関連する請求データは残りますが、契約情報は復元できません。" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </>
  );
}
