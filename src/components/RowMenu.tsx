"use client";

import { Pencil } from "lucide-react";

interface RowMenuProps {
  onEdit: () => void;
  onDelete?: () => void;
}

export default function RowMenu({ onEdit }: RowMenuProps) {
  return (
    <button
      onClick={onEdit}
      className="p-1.5 rounded text-ink-3 hover:text-accent hover:bg-accent-tint transition-colors"
    >
      <Pencil size={14} />
    </button>
  );
}
