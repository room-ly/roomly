"use client";

import { useState } from "react";
import { Plus, ArrowRight, Pencil } from "lucide-react";
import UnitFormModal from "./UnitFormModal";
import PropertyFormModal from "./PropertyFormModal";

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

interface Owner {
  id: string;
  name: string;
}

interface PropertyDetailClientProps {
  propertyId: string;
  property: Record<string, any>;
  owners: Owner[];
}

export default function PropertyDetailClient({
  propertyId,
  property,
  owners,
}: PropertyDetailClientProps) {
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
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
    setUnitModalOpen(true);
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
        alert(data.error || "チェックアウトの作成に失敗しました");
        setUpgrading(false);
      }
    } catch {
      alert("エラーが発生しました");
      setUpgrading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => setPropertyModalOpen(true)}
        >
          <Pencil size={14} />
          物件を編集
        </button>
        <button
          className="btn btn-primary disabled:opacity-50"
          onClick={handleAddClick}
          disabled={checking}
        >
          <Plus size={14} />
          {checking ? "確認中..." : "部屋を追加"}
        </button>
      </div>

      <PropertyFormModal
        isOpen={propertyModalOpen}
        onClose={() => setPropertyModalOpen(false)}
        owners={owners}
        editData={property}
      />

      <UnitFormModal
        isOpen={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        propertyId={propertyId}
        propertyType={property.property_type}
      />

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
                onClick={() => setLimitInfo(null)}
                disabled={upgrading}
                className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors disabled:opacity-50"
              >
                閉じる
              </button>
              <button
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
    </>
  );
}
