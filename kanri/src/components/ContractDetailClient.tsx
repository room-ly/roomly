"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, FileText, FileCheck, RefreshCw } from "lucide-react";
import ContractFormModal from "./ContractFormModal";
import ConfirmDialog from "./ConfirmDialog";
import { usePermission } from "@/lib/use-permission";
import { useNotify } from "@/lib/confirm-context";

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
  const notify = useNotify();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // プレビュー取得中は確定ボタンを押せないようにする（取得完了前の誤クリック削除を防ぐ）
  const [previewing, setPreviewing] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("削除内容を確認しています…");
  const canEdit = usePermission("contracts:edit");
  const canDelete = usePermission("contracts:delete");

  // 削除ダイアログを開くと同時に、紐づく請求・入金の件数を取得して文面に反映する
  async function openDelete() {
    setDeleteMsg("削除内容を確認しています…");
    setPreviewing(true);
    setDeleteOpen(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}?preview=1`);
      if (!res.ok) throw new Error();
      const p = (await res.json()) as { billings: number; payments: number; mode: "void" | "physical" };
      if (p.mode === "void") {
        setDeleteMsg(
          `この契約には入金/返金履歴が${p.payments}件あります。お金の記録のため、契約と請求${p.billings}件は「取り消し済み」として一覧から非表示にします（履歴はデータベースに残ります）。よろしいですか？`
        );
      } else {
        setDeleteMsg(
          `この契約と紐づく家賃請求${p.billings}件を完全に削除します。入金履歴はないため復元できません。よろしいですか？`
        );
      }
    } catch {
      setDeleteMsg("この契約を削除します。紐づく請求データも一緒に処理されます。よろしいですか？");
    } finally {
      setPreviewing(false);
    }
  }

  const latestMoveOut = moveOutRequests?.[0];
  const editData = {
    ...contract,
    move_out_date: contract.move_out_date || latestMoveOut?.desired_move_out_date || "",
  };

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/contracts/${contract.id}`, { method: "DELETE" });
    if (res.ok) router.push("/contracts");
    else { notify({ title: "削除に失敗しました" }); setDeleting(false); }
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
        {(contract.status === "terminated" || contract.move_out_date) && (
          <a href={`/api/contracts/${contract.id}/move-out-settlement`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex items-center gap-1.5 text-[13px]" style={{ color: "var(--warn)" }}>
            <FileText size={13} /> 退去精算書
          </a>
        )}
        {canEdit && (
          <button onClick={() => setModalOpen(true)} className="btn btn-secondary flex items-center gap-1.5 text-[13px]">
            <Pencil size={13} /> 編集
          </button>
        )}
        {canDelete && (
          <button onClick={openDelete} className="p-2 rounded text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <ContractFormModal key={modalOpen ? "open" : "closed"} isOpen={modalOpen} onClose={() => setModalOpen(false)} units={units} tenants={tenants} editData={editData} />
      <ConfirmDialog isOpen={deleteOpen} title="契約を削除" message={deleteMsg} loading={deleting || previewing} loadingLabel={previewing ? "確認中..." : "処理中..."} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </>
  );
}
