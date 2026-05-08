"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import OwnerFormModal from "./OwnerFormModal";

interface OwnersTableProps {
  owners: Record<string, any>[];
}

function OwnerMenu({
  owner,
  onEdit,
  onDelete,
}: {
  owner: Record<string, any>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 112 });
    }
    setOpen(!open);
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="p-1 rounded text-text-muted hover:text-text hover:bg-bg-secondary transition-colors"
      >
        <MoreVertical size={14} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-28 bg-card rounded border border-border shadow-md z-50 overflow-hidden"
            style={{ top: pos.top, left: pos.left }}
          >
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              <Pencil size={12} /> 編集
            </button>
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-danger hover:bg-danger-bg transition-colors"
            >
              <Trash2 size={12} /> 削除
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

export default function OwnersTable({ owners }: OwnersTableProps) {
  const router = useRouter();
  const [editOwner, setEditOwner] = useState<Record<string, any> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function deleteOwner(owner: Record<string, any>) {
    if (!confirm(`「${owner.name}」を削除しますか？`)) return;
    const res = await fetch(`/api/owners/${owner.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("削除に失敗しました");
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-text-muted border-b border-border-light">
                <th className="px-5 py-2.5 font-medium">オーナー名</th>
                <th className="px-5 py-2.5 font-medium">電話番号</th>
                <th className="px-5 py-2.5 font-medium">メール</th>
                <th className="px-5 py-2.5 font-medium text-center">物件数</th>
                <th className="px-5 py-2.5 font-medium text-center">総戸数</th>
                <th className="px-5 py-2.5 font-medium text-center">入居</th>
                <th className="px-5 py-2.5 font-medium text-right">手数料率</th>
                <th className="px-5 py-2.5 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {owners.map((o) => (
                <tr key={o.id} className="border-b border-border-light last:border-0 hover:bg-bg-secondary/30 transition-colors">
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center text-accent text-[11px] font-semibold shrink-0">
                        {o.name?.charAt(0)}
                      </div>
                      <span className="font-medium">{o.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-text-secondary">{o.phone || "—"}</td>
                  <td className="px-5 py-2.5 text-text-secondary">{o.email || "—"}</td>
                  <td className="px-5 py-2.5 text-center tabular-nums">{o.propertyCount}</td>
                  <td className="px-5 py-2.5 text-center tabular-nums">{o.unitCount}</td>
                  <td className="px-5 py-2.5 text-center tabular-nums text-success">{o.occupiedCount}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{Number(o.management_fee_rate)}%</td>
                  <td className="px-5 py-2.5">
                    <OwnerMenu
                      owner={o}
                      onEdit={() => { setEditOwner(o); setModalOpen(true); }}
                      onDelete={() => deleteOwner(o)}
                    />
                  </td>
                </tr>
              ))}
              {owners.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-text-muted">
                    オーナーが登録されていません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OwnerFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditOwner(null); }}
        editData={editOwner}
      />
    </>
  );
}
