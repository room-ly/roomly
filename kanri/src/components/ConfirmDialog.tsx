"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = "削除する", loading, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-surface rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-danger-tint flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-danger" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold mb-1">{title}</h3>
            <p className="text-[13px] text-ink-2">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-surface-2 transition-colors">
            キャンセル
          </button>
          <button onClick={onConfirm} disabled={loading} className="bg-danger text-white rounded-lg px-4 py-2 text-sm hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "処理中..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
