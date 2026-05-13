"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import UnitFormModal from "./UnitFormModal";

interface PlanInfo {
  currentUnits: number;
  maxUnits: number;
}

interface PropertyDetailClientProps {
  propertyId: string;
}

export default function PropertyDetailClient({
  propertyId,
}: PropertyDetailClientProps) {
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [limitModal, setLimitModal] = useState<PlanInfo | null>(null);

  async function handleAddClick() {
    setChecking(true);
    try {
      const res = await fetch("/api/plan-check");
      const data = await res.json();
      if (data.isOver) {
        setLimitModal({ currentUnits: data.currentUnits, maxUnits: data.maxUnits });
        return;
      }
    } catch {
      // チェック失敗時はフォームを開く（API側で再チェックされる）
    } finally {
      setChecking(false);
    }
    setUnitModalOpen(true);
  }

  return (
    <>
      <button
        className="btn btn-primary disabled:opacity-50"
        onClick={handleAddClick}
        disabled={checking}
      >
        <Plus size={14} />
        {checking ? "確認中..." : "部屋を追加"}
      </button>

      <UnitFormModal
        isOpen={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        propertyId={propertyId}
      />

      {limitModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setLimitModal(null)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[15px] font-semibold mb-3">
              区画数の上限に達しています
            </h2>
            <p className="text-[13px] text-ink-2 mb-4">
              現在 {limitModal.currentUnits}区画を登録中です。フリープランの上限（{limitModal.maxUnits}区画）に達しているため、新しい部屋を追加できません。
            </p>
            <div className="card p-4 mb-6 bg-accent-tint">
              <p className="text-[13px] font-medium text-accent mb-1">プランをアップグレード</p>
              <p className="text-[12px] text-ink-3">
                スタンダードプランなら50区画まで。月額¥5,500（税込）から。
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLimitModal(null)}
                className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors"
              >
                閉じる
              </button>
              <a href="/settings" className="btn btn-primary">
                プランを変更
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
