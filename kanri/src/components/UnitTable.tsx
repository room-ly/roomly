"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight } from "lucide-react";
import { useNotify } from "@/lib/confirm-context";
import UnitFormModal from "./UnitFormModal";

interface PlanOption {
  priceId: string;
  name: string;
  maxUnits: number;
  price: number;
  label: string;
}

interface LimitInfo {
  currentUnits: number;
  maxUnits: number;
  nextPlan: PlanOption;
}

interface UnitTableProps {
  propertyId: string;
  propertyType?: string | null;
  units: Record<string, any>[];
  contracts: Record<string, any>[];
  // 一覧右上に「部屋を追加」ボタンを表示する（編集モーダル内などで使う）
  showAddButton?: boolean;
}

export default function UnitTable({ propertyId, propertyType, units, contracts, showAddButton }: UnitTableProps) {
  const router = useRouter();
  const notify = useNotify();
  const [addOpen, setAddOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  async function handleAddClick() {
    setChecking(true);
    try {
      const res = await fetch("/api/plan-check");
      const data = await res.json();
      if (data.isOver) {
        const plans: PlanOption[] = data.plans || [];
        const nextPlan = plans.find((p) => p.maxUnits > data.currentUnits) || plans[0];
        if (nextPlan) {
          setLimitInfo({ currentUnits: data.currentUnits, maxUnits: data.maxUnits, nextPlan });
          return;
        }
      }
    } catch {
      // チェック失敗時はフォームを開く（API側で再チェックされる）
    } finally {
      setChecking(false);
    }
    setAddOpen(true);
  }

  async function handleUpgrade() {
    if (!limitInfo) return;
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: limitInfo.nextPlan.priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        notify({ title: data.error || "チェックアウトの作成に失敗しました" });
        setUpgrading(false);
      }
    } catch {
      notify({ title: "エラーが発生しました" });
      setUpgrading(false);
    }
  }

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
        {showAddButton && (
          <button
            type="button"
            onClick={handleAddClick}
            disabled={checking}
            className="btn btn-secondary disabled:opacity-50"
          >
            <Plus size={14} />
            {checking ? "確認中..." : "部屋を追加"}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="text-left text-ink-3 border-b border-line">
              <th className="px-5 py-2.5 font-medium whitespace-nowrap">部屋番号</th>
              <th className="px-5 py-2.5 font-medium whitespace-nowrap">階</th>
              <th className="px-5 py-2.5 font-medium whitespace-nowrap">間取り</th>
              <th className="px-5 py-2.5 font-medium whitespace-nowrap">面積</th>
              <th className="px-5 py-2.5 font-medium text-right whitespace-nowrap">賃料</th>
              <th className="px-5 py-2.5 font-medium text-right whitespace-nowrap">管理費</th>
              <th className="px-5 py-2.5 font-medium whitespace-nowrap">状態</th>
              <th className="px-5 py-2.5 font-medium whitespace-nowrap">入居者</th>
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
                  <td className={`px-5 py-2.5 font-medium whitespace-nowrap ${isHidden ? "blur-[3px]" : ""}`}>{unit.unit_number}</td>
                  <td className={`px-5 py-2.5 whitespace-nowrap ${isHidden ? "blur-[3px]" : ""}`}>{unit.floor ? `${unit.floor}F` : "—"}</td>
                  <td className={`px-5 py-2.5 whitespace-nowrap ${isHidden ? "blur-[3px]" : ""}`}>{unit.layout || "—"}</td>
                  <td className={`px-5 py-2.5 whitespace-nowrap ${isHidden ? "blur-[3px]" : ""}`}>{unit.area_sqm ? `${Number(unit.area_sqm)}m²` : "—"}</td>
                  <td className={`px-5 py-2.5 text-right tabular-nums whitespace-nowrap ${isHidden ? "blur-[3px]" : ""}`}>¥{Number(unit.rent).toLocaleString()}</td>
                  <td className={`px-5 py-2.5 text-right tabular-nums whitespace-nowrap ${isHidden ? "blur-[3px]" : ""}`}>¥{Number(unit.management_fee).toLocaleString()}</td>
                  <td className={`px-5 py-2.5 whitespace-nowrap ${isHidden ? "blur-[3px]" : ""}`}>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${s.cls}`}>
                      {s.text}
                    </span>
                  </td>
                  <td className={`px-5 py-2.5 text-ink-2 whitespace-nowrap ${isHidden ? "blur-[3px]" : ""}`}>{contract?.tenant?.name || "—"}</td>
                </tr>
              );
            })}
            {units.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-ink-3 text-[13px]">
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

      {showAddButton && (
        <UnitFormModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          propertyId={propertyId}
          propertyType={propertyType}
        />
      )}

      {limitInfo && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !upgrading && setLimitInfo(null)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[15px] font-semibold mb-3">
              区画数の上限に達しています
            </h2>
            <p className="text-[13px] text-ink-2 mb-2">
              現在の登録数 <span className="font-semibold text-ink">{limitInfo.currentUnits}区画</span>
              {" "}/ 上限 {limitInfo.maxUnits}区画
            </p>
            <p className="text-[13px] text-ink-2 mb-5">
              新しい部屋を追加するにはプランのアップグレードが必要です。
            </p>

            <div className="card p-4 mb-6 border-2 border-accent">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[14px] font-semibold text-accent">{limitInfo.nextPlan.name}プラン</p>
                <p className="text-[14px] font-semibold">{limitInfo.nextPlan.label}</p>
              </div>
              <p className="text-[12px] text-ink-3">
                {limitInfo.nextPlan.maxUnits}区画まで登録可能
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLimitInfo(null)}
                disabled={upgrading}
                className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors disabled:opacity-50"
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={upgrading}
                className="btn btn-primary inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {upgrading ? "移動中..." : (
                  <>アップグレード <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
