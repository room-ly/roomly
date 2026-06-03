"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Mail } from "lucide-react";
import CaseFormModal from "./CaseFormModal";
import ConfirmDialog from "./ConfirmDialog";
import { usePermission } from "@/lib/use-permission";
import { useNotify } from "@/lib/confirm-context";

interface SelectOption {
  id: string;
  label: string;
}

interface CaseDetailClientProps {
  caseRow: Record<string, any>;
  properties: SelectOption[];
}

export default function CaseDetailClient({ caseRow, properties }: CaseDetailClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const notify = useNotify();
  const canEdit = usePermission("cases:edit");
  const canDelete = usePermission("cases:delete");

  const owner = caseRow.property?.owner;
  const ownerEmail = owner?.email as string | undefined;

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/cases/${caseRow.id}`, { method: "DELETE" });
    if (res.ok) router.push("/cases");
    else { notify({ title: "削除に失敗しました" }); setDeleting(false); }
  }

  async function handleNotifyOwner() {
    setNotifying(true);
    try {
      const res = await fetch(`/api/cases/${caseRow.id}/notify-owner`, { method: "POST" });
      if (res.ok) {
        setNotifyOpen(false);
        notify({ title: `${owner?.name || "オーナー"}様にメールを送信しました` });
      } else {
        const err = await res.json().catch(() => ({}));
        notify({ title: err.error || "メール送信に失敗しました" });
      }
    } finally {
      setNotifying(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {ownerEmail && canEdit && (
          <button onClick={() => setNotifyOpen(true)} className="btn btn-secondary flex items-center gap-1.5 text-[13px]">
            <Mail size={13} /> オーナーに通知
          </button>
        )}
        {canEdit && (
          <button onClick={() => setModalOpen(true)} className="btn btn-secondary flex items-center gap-1.5 text-[13px]">
            <Pencil size={13} /> 編集
          </button>
        )}
        {canDelete && (
          <button onClick={() => setDeleteOpen(true)} className="p-2 rounded text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <CaseFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} properties={properties} editData={caseRow} />
      <ConfirmDialog isOpen={deleteOpen} title="対応案件を削除" message="この対応案件を削除しますか？対応履歴も含めて復元できません。" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />

      {notifyOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setNotifyOpen(false)}>
          <div className="bg-surface rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent-tint flex items-center justify-center shrink-0">
                <Mail size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold mb-1">オーナーに通知</h3>
                <p className="text-[13px] text-ink-2">
                  {owner?.name || "オーナー"}様（<span className="mono">{ownerEmail}</span>）に、この対応案件の内容をメールで送信します。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setNotifyOpen(false)} className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-surface-2 transition-colors">
                キャンセル
              </button>
              <button onClick={handleNotifyOwner} disabled={notifying} className="bg-accent text-white rounded-lg px-4 py-2 text-sm hover:bg-accent-deep transition-colors disabled:opacity-50">
                {notifying ? "送信中..." : "送信する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
