"use client";

import { Check } from "lucide-react";

// 一覧行の選択チェックボックス。
// アイコン頼りだと選択可否・選択状態が判別しづらいため、
// 塗り・枠線のはっきりしたボックスとして描画する。
export default function SelectBox({
  checked,
  disabled = false,
}: {
  checked: boolean;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center w-[18px] h-[18px] rounded-[4px] border-2 transition-colors shrink-0";

  if (disabled) {
    return (
      <span
        aria-hidden
        className={`${base} border-border bg-surface-2 opacity-60`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={
        checked
          ? `${base} border-accent bg-accent text-white`
          : `${base} border-ink-4 bg-surface hover:border-accent`
      }
    >
      {checked && <Check size={13} strokeWidth={3.5} />}
    </span>
  );
}
