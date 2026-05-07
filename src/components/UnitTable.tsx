"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import UnitFormModal from "./UnitFormModal";

interface UnitTableProps {
  propertyId: string;
  units: Record<string, any>[];
  contracts: Record<string, any>[];
}

export default function UnitTable({ propertyId, units, contracts }: UnitTableProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editUnit, setEditUnit] = useState<Record<string, any> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function deleteUnit(unitId: string) {
    if (!confirm("この部屋を削除しますか？")) return;
    setDeleting(unitId);
    const res = await fetch(`/api/units/${unitId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    setDeleting(null);
  }

  const statusLabel: Record<string, { text: string; cls: string }> = {
    occupied: { text: "入居中", cls: "bg-success/10 text-success" },
    vacant: { text: "空室", cls: "bg-accent/10 text-accent" },
    reserved: { text: "申込中", cls: "bg-warning/10 text-warning" },
    maintenance: { text: "メンテ中", cls: "bg-bg-secondary text-text-muted" },
  };

  return (
    <>
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-border-light">
          <h2 className="text-[13px] font-semibold">部屋一覧（{units.length}戸）</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-text-muted border-b border-border-light">
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
                return (
                  <tr key={unit.id} className="border-b border-border-light last:border-0 hover:bg-bg-secondary/30 transition-colors">
                    <td className="px-5 py-2.5 font-medium">{unit.unit_number}</td>
                    <td className="px-5 py-2.5">{unit.floor ? `${unit.floor}F` : "—"}</td>
                    <td className="px-5 py-2.5">{unit.layout || "—"}</td>
                    <td className="px-5 py-2.5">{unit.area_sqm ? `${Number(unit.area_sqm)}m²` : "—"}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">¥{Number(unit.rent).toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">¥{Number(unit.management_fee).toLocaleString()}</td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${s.cls}`}>
                        {s.text}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-text-secondary">{contract?.tenant?.name || "—"}</td>
                    <td className="px-5 py-2.5">
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === unit.id ? null : unit.id)}
                          className="p-1 rounded text-text-muted hover:text-text hover:bg-bg-secondary transition-colors"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {menuOpen === unit.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-full mt-1 w-28 bg-card rounded border border-border shadow-md z-50 overflow-hidden">
                              <button
                                onClick={() => {
                                  setEditUnit(unit);
                                  setModalOpen(true);
                                  setMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text-secondary hover:bg-bg-secondary transition-colors"
                              >
                                <Pencil size={12} />
                                編集
                              </button>
                              <button
                                onClick={() => {
                                  setMenuOpen(null);
                                  deleteUnit(unit.id);
                                }}
                                disabled={deleting === unit.id}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-danger hover:bg-danger-bg transition-colors"
                              >
                                <Trash2 size={12} />
                                {deleting === unit.id ? "削除中..." : "削除"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {units.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-text-muted text-[13px]">
                    部屋が登録されていません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
