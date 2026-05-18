"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatPhone } from "@/lib/phone";
import OwnerFormModal from "./OwnerFormModal";

interface OwnerCardProps {
  owner: Record<string, any>;
}

export default function OwnerCard({ owner }: OwnerCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleDelete() {
    if (!confirm(`「${owner.name}」を削除しますか？`)) return;
    setDeleting(true);
    const res = await fetch(`/api/owners/${owner.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("削除に失敗しました");
    }
    setDeleting(false);
    setMenuOpen(false);
  }

  return (
    <>
      <div className="card card-interactive p-4 relative">
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded hover:bg-bg-2 transition-colors text-ink-3"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-surface border border-line rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setEditOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-bg-2 transition-colors"
              >
                <Pencil size={13} /> 編集
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-danger hover:bg-bg-2 transition-colors"
              >
                <Trash2 size={13} /> 削除
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded bg-accent-tint flex items-center justify-center text-accent text-[13px] font-semibold">
            {owner.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold">{owner.name}</h3>
          </div>
        </div>

        <div className="flex gap-2 text-center mb-4">
          <div className="flex-1 py-1.5 rounded bg-bg-2">
            <p className="text-[10px] text-ink-3">物件数</p>
            <p className="text-[15px] font-semibold tabular-nums">{owner.propertyCount}</p>
          </div>
          <div className="flex-1 py-1.5 rounded bg-bg-2">
            <p className="text-[10px] text-ink-3">総戸数</p>
            <p className="text-[15px] font-semibold tabular-nums">{owner.unitCount}</p>
          </div>
          <div className="flex-1 py-1.5 rounded bg-bg-2">
            <p className="text-[10px] text-ink-3">入居</p>
            <p className="text-[15px] font-semibold text-accent-deep tabular-nums">{owner.occupiedCount}</p>
          </div>
        </div>

        <div className="border-t border-line pt-3 space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-ink-3">家賃収入</span>
            <span className="font-medium tabular-nums">¥{owner.totalRent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-3">管理手数料</span>
            <span className="text-danger font-medium tabular-nums">-¥{owner.managementFee.toLocaleString()}</span>
          </div>
          {owner.expenseDeducted > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-3">経費控除</span>
              <span className="text-warn font-medium tabular-nums">-¥{owner.expenseDeducted.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-line">
            <span className="font-medium">送金額</span>
            <span className="font-semibold text-accent text-[15px] tabular-nums">¥{owner.netAmount.toLocaleString()}</span>
          </div>
        </div>

        {(owner.phone || owner.email) && (
          <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-3">
            {owner.phone && <span>{formatPhone(owner.phone)}</span>}
            {owner.email && <span>{owner.email}</span>}
          </div>
        )}
      </div>

      <OwnerFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        editData={owner}
      />
    </>
  );
}
