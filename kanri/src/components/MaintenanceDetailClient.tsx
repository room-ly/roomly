"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Mail } from "lucide-react";
import MaintenanceFormModal from "./MaintenanceFormModal";
import ConfirmDialog from "./ConfirmDialog";

interface SelectOption {
  id: string;
  label: string;
}

interface MaintenanceDetailClientProps {
  request: Record<string, any>;
  properties: SelectOption[];
}

export default function MaintenanceDetailClient({ request, properties }: MaintenanceDetailClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const owner = request.property?.owner;
  const ownerEmail = owner?.email as string | undefined;

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/maintenance/${request.id}`, { method: "DELETE" });
    if (res.ok) router.push("/maintenance");
    else { alert("削除に失敗しました"); setDeleting(false); }
  }

  async function handleNotifyOwner() {
    setNotifying(true);
    try {
      const res = await fetch(`/api/maintenance/${request.id}/notify-owner`, { method: "POST" });
      if (res.ok) {
        setNotifyOpen(false);
        alert(`${owner?.name || "オーナー"}様にメールを送信しました`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "メール送信に失敗しました");
      }
    } finally {
      setNotifying(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {ownerEmail && (
          <button onClick={() => setNotifyOpen(true)} className="btn btn-secondary flex items-center gap-1.5 text-[13px]">
            <Mail size={13} /> オーナーに通知
          </button>
        )}
        <button onClick={() => setModalOpen(true)} className="btn btn-secondary flex items-center gap-1.5 text-[13px]">
          <Pencil size={13} /> 編集
        </button>
        <button onClick={() => setDeleteOpen(true)} className="p-2 rounded text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      <MaintenanceFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} properties={properties} editData={request} />
      <ConfirmDialog isOpen={deleteOpen} title="修繕依頼を削除" message="この修繕依頼を削除しますか？対応履歴も含めて復元できません。" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />

      {/* オーナー通知の確認ダイアログ（破壊的操作ではないのでシンプルな確認） */}
      {notifyOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setNotifyOpen(false)}>
          <div className="bg-surface rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent-tint flex items-center justify-center shrink-0">
                <Mail size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold mb-1">オーナーに修繕を通知</h3>
                <p className="text-[13px] text-ink-2">
                  {owner?.name || "オーナー"}様（<span className="mono">{ownerEmail}</span>）に、この修繕依頼の内容をメールで送信します。
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
