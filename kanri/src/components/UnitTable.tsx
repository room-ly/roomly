"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import UnitFormModal from "./UnitFormModal";

interface UnitTableProps {
  propertyId: string;
  units: Record<string, any>[];
  contracts: Record<string, any>[];
}

export default function UnitTable({ propertyId, units, contracts }: UnitTableProps) {
  const router = useRouter();
  const [editUnit, setEditUnit] = useState<Record<string, any> | null>(null);

  const hiddenCount = units.filter((u) => u._hidden).length;

  const statusLabel: Record<string, { text: string; cls: string }> = {
    occupied: { text: "入居中", cls: "bg-accent-tint text-accent-deep" },
    vacant: { text: "空室", cls: "bg-accent-tint text-accent" },
    reserved: { text: "申込中", cls: "bg-warn-tint text-warn" },
    maintenance: { text: "メンテ中", cls: "bg-bg-2 text-ink-3" },
  };

  return (
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
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => {
              const contract = contracts.find((c) => c.unit_id === unit.id);
              const s = statusLabel[unit.status] || statusLabel.maintenance;
              const isHidden = unit._hidden;
              return (
                <tr
                  key={unit.id}
                  onClick={() => {
                    if (!isHidden) router.push(`/properties/${propertyId}/units/${unit.id}`);
                  }}
                  className={`border-b border-line last:border-0 transition-colors ${isHidden ? "select-none" : "hover:bg-bg-2/30 cursor-pointer"}`}
                >
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
                  <td className="px-2 py-2.5">
                    {!isHidden && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditUnit(unit);
                        }}
                        className="p-1.5 rounded-md text-ink-3 hover:text-accent hover:bg-accent-tint transition-colors"
                        title="編集"
                      >
                        <Pencil size={14} />
                      </button>
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

      <UnitFormModal
        isOpen={!!editUnit}
        onClose={() => setEditUnit(null)}
        propertyId={propertyId}
        editData={editUnit}
      />
    </div>
  );
}
