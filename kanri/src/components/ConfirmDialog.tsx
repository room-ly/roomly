"use client";

import { AlertTriangle, Info, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  // danger: 削除など破壊的操作（赤・警告アイコン） / neutral: 設定変更など（落ち着いた色・情報アイコン）
  variant?: "danger" | "neutral";
  // 通知用途（OKのみ）でキャンセルボタンを隠す
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = "削除する", loading, variant = "danger", hideCancel, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  const isNeutral = variant === "neutral";
  const Icon = isNeutral ? Info : AlertTriangle;
  const iconWrapClass = isNeutral ? "bg-bg-2" : "bg-danger-tint";
  const iconClass = isNeutral ? "text-ink-2" : "text-danger";
  const confirmBtnClass = isNeutral
    ? "bg-ink text-surface rounded-lg px-4 py-2 text-sm hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
    : "bg-danger text-white rounded-lg px-4 py-2 text-sm hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-surface rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${iconWrapClass} flex items-center justify-center shrink-0`}>
            <Icon size={20} className={iconClass} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold mb-1">{title}</h3>
            <p className="text-[13px] text-ink-2">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {!hideCancel && (
            <button onClick={onCancel} className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-surface-2 transition-colors">
              キャンセル
            </button>
          )}
          <button onClick={onConfirm} disabled={loading} className={confirmBtnClass}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "処理中..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
