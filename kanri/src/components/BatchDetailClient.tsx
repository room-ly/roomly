"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Check, Trash2, Loader2 } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { useConfirm, useNotify } from "@/lib/confirm-context";

interface Props {
  batchId: string;
  batchDate: string;
  status: string;
  itemCount: number;
}

export default function BatchDetailClient({ batchId, batchDate, status, itemCount }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const notify = useNotify();
  const [csvLoading, setCsvLoading] = useState(false);
  const [execLoading, setExecLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isExecuted = status === "executed";

  async function handleCsv() {
    setCsvLoading(true);
    try {
      const res = await fetch(`/api/payment-batches/${batchId}/zengin-csv`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        notify({ title: err.error || "CSV出力に失敗しました" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zengin_${batchDate}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setCsvLoading(false);
    }
  }

  async function handleExecute() {
    const ok = await confirm({
      title: "振込実行済みにする",
      message: `この${itemCount}件を振込実行済みにします。含まれるオーナー送金は「送金済み」、費用は「支払済み」になり、以降は変更できません。よろしいですか？`,
      variant: "neutral",
      confirmLabel: "実行済みにする",
    });
    if (!ok) return;
    setExecLoading(true);
    try {
      const res = await fetch(`/api/payment-batches/${batchId}/execute`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        notify({ title: err.error || "実行に失敗しました" });
        return;
      }
      router.refresh();
    } finally {
      setExecLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/payment-batches/${batchId}`, { method: "DELETE" });
    if (res.ok) router.push("/payments");
    else { notify({ title: "削除に失敗しました" }); setDeleting(false); }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={handleCsv} disabled={csvLoading}
          className="btn btn-secondary flex items-center gap-1.5 text-[13px]">
          {csvLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          全銀CSV
        </button>
        {!isExecuted && (
          <>
            <button onClick={handleExecute} disabled={execLoading}
              className="btn btn-primary flex items-center gap-1.5 text-[13px]">
              {execLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              振込実行済みにする
            </button>
            <button onClick={() => setDeleteOpen(true)}
              className="p-2 rounded text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors">
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
      <ConfirmDialog isOpen={deleteOpen} title="振込バッチを削除"
        message="このバッチを削除しますか？対象の送金・費用は再び振込候補に戻ります。"
        loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </>
  );
}
