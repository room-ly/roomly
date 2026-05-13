"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import UnitFormModal from "./UnitFormModal";

interface UnitTableProps {
  propertyId: string;
  units: Record<string, any>[];
  contracts: Record<string, any>[];
}

function UnitMenu({
  unit,
  onEdit,
  onDelete,
  deleting,
}: {
  unit: Record<string, any>;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
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
        className="p-1 rounded text-ink-3 hover:text-ink hover:bg-bg-2 transition-colors"
      >
        <MoreVertical size={14} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-28 bg-surface rounded border border-line shadow-md z-50 overflow-hidden"
            style={{ top: pos.top, left: pos.left }}
          >
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-ink-2 hover:bg-bg-2 transition-colors"
            >
              <Pencil size={12} />
              編集
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              disabled={deleting}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-danger hover:bg-danger-tint transition-colors"
            >
              <Trash2 size={12} />
              {deleting ? "削除中..." : "削除"}
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

export default function UnitTable({ propertyId, units, contracts }: UnitTableProps) {
  const router = useRouter();
  const [editUnit, setEditUnit] = useState<Record<string, any> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const hiddenCount = units.filter((u) => u._hidden).length;

  async function deleteUnit(unitId: string) {
    if (!confirm("この部屋を削除しますか？")) return;
    setDeleting(unitId);
    const res = await fetch(`/api/units/${unitId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    setDeleting(null);
  }

  const statusLabel: Record<string, { text: string; cls: string }> = {
    occupied: { text: "入居中", cls: "bg-accent-tint text-accent-deep" },
    vacant: { text: "空室", cls: "bg-accent-tint text-accent" },
    reserved: { text: "申込中", cls: "bg-warn-tint text-warn" },
    maintenance: { text: "メンテ中", cls: "bg-bg-2 text-ink-3" },
  };

  return (
    <>
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-line flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">部屋一覧（{units.length}戸）</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-ink-3 border-b border-line">
                <th className="px-5 py-2.5 font-medium">部屋番号</th>
                <th className="px-5 py-2.5 font-medium">階</th>
                <th className="px-5 py-2.5 font-medium">間取り</th>
                <th className="px-5 py-2.5 font-medium">面積</th>
                <th className="px-5 py-2.5 font-medium text-right">賃料</th>
                <th className="px-5 py-2.5 font-medium text-right">管理費</th>
                <th className="px-5 py-2.5 font-medium">状態</th>
                <th className="px-5 py-2.5 font-medium">入居者</th>
                <th className="px-5 py-2.5 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => {
                const contract = contracts.find((c) => c.unit_id === unit.id);
                const s = statusLabel[unit.status] || statusLabel.maintenance;
                const isHidden = unit._hidden;
                return (
                  <tr key={unit.id} className={`border-b border-line last:border-0 transition-colors ${isHidden ? "select-none" : "hover:bg-bg-2/30"}`}>
                    <td className={`px-5 py-2.5 font-medium ${isHidden ? "blur-[3px]" : ""}`}>{unit.unit_number}</td>
                    <td className={`px-5 py-2.5 ${isHidden ? "blur-[3px]" : ""}`}>{unit.floor ? `${unit.floor}F` : "—"}</td>
                    <td className={`px-5 py-2.5 ${isHidden ? "blur-[3px]" : ""}`}>{unit.layout || "—"}</td>
                    <td className={`px-5 py-2.5 ${isHidden ? "blur-[3px]" : ""}`}>{unit.area_sqm ? `${Number(unit.area_sqm)}m²` : "—"}</td>
                    <td className={`px-5 py-2.5 text-right tabular-nums ${isHidden ? "blur-[3px]" : ""}`}>¥{Number(unit.rent).toLocaleString()}</td>
                    <td className={`px-5 py-2.5 text-right tabular-nums ${isHidden ? "blur-[3px]" : ""}`}>¥{Number(unit.management_fee).toLocaleString()}</td>
                    <td className={`px-5 py-2.5 ${isHidden ? "blur-[3px]" : ""}`}>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${s.cls}`}>
                        {s.text}
                      </span>
                    </td>
                    <td className={`px-5 py-2.5 text-ink-2 ${isHidden ? "blur-[3px]" : ""}`}>{contract?.tenant?.name || "—"}</td>
                    <td className="px-5 py-2.5">
                      {!isHidden && (
                        <UnitMenu
                          unit={unit}
                          onEdit={() => {
                            setEditUnit(unit);
                            setModalOpen(true);
                          }}
                          onDelete={() => deleteUnit(unit.id)}
                          deleting={deleting === unit.id}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
              {units.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-ink-3 text-[13px]">
                    部屋が登録されていません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {hiddenCount > 0 && (
          <div className="px-5 py-3 border-t border-line bg-warn/5 text-center">
            <span className="text-[12px] text-warn font-medium">
              +{hiddenCount}戸はプラン制限中です（アップグレードすると閲覧・編集できます）
            </span>
          </div>
        )}
      </div>

      <UnitFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditUnit(null); }}
        propertyId={propertyId}
        editData={editUnit}
      />
    </>
  );
}
