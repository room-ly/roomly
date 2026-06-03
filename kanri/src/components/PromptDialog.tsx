"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

interface PromptDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  // input の type（"text" | "date" | "number" など）。デフォルト text
  inputType?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  // 値を返して確定（空文字キャンセルは null）
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

// window.prompt をアプリ標準の中央モーダルに置き換えるための入力ダイアログ。
export default function PromptDialog({
  isOpen,
  title,
  message,
  inputType = "text",
  placeholder,
  defaultValue = "",
  confirmLabel = "OK",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // 開くたびに初期値へリセットし、入力欄にフォーカスする
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      // モーダル描画後にフォーカス
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const submit = () => {
    if (!value) return;
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-surface rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-bg-2 flex items-center justify-center shrink-0">
            <Pencil size={18} className="text-ink-2" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold mb-1">{title}</h3>
            {message && <p className="text-[13px] text-ink-2">{message}</p>}
          </div>
        </div>
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm mb-4 bg-surface focus:outline-none focus:ring-2 focus:ring-accent-soft"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-surface-2 transition-colors">
            キャンセル
          </button>
          <button onClick={submit} disabled={!value} className="bg-ink text-surface rounded-lg px-4 py-2 text-sm hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
