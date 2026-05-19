"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, FileText } from "lucide-react";
import OwnerFormModal from "./OwnerFormModal";

interface OwnerDetailClientProps {
  owner: Record<string, any>;
}

export default function OwnerDetailClient({ owner }: OwnerDetailClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [reportOpen, setReportOpen] = useState(false);

  async function handleDelete() {
    if (!confirm(`「${owner.name}」を削除しますか？`)) return;
    const res = await fetch(`/api/owners/${owner.id}`, { method: "DELETE" });
    if (res.ok) router.push("/owners");
    else alert("削除に失敗しました");
  }

  function openReport() {
    window.open(`/api/owners/${owner.id}/report?month=${reportMonth}`, "_blank");
    setReportOpen(false);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setReportOpen(!reportOpen)}
            className="btn btn-ghost flex items-center gap-1.5 text-[13px]"
          >
            <FileText size={13} />
            月次レポート
          </button>
          {reportOpen && (
            <div className="absolute right-0 top-full mt-1 bg-surface rounded-lg shadow-lg border p-3 z-50 w-56">
              <label className="text-xs font-medium text-ink-2 block mb-1">対象月</label>
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="input text-[13px] mb-2 w-full"
              />
              <button onClick={openReport} className="btn btn-primary w-full text-[13px]">
                レポートを表示
              </button>
            </div>
          )}
        </div>
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

      <OwnerFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editData={owner}
      />
    </>
  );
}
