"use client";

import { useState, useEffect } from "react";

interface FreemiumGateProps {
  children: React.ReactNode;
  onBlock?: () => void;
}

interface PlanInfo {
  currentUnits: number;
  maxUnits: number;
  plan: string;
  isOver: boolean;
}

// フリーミアム制御: 新規部屋追加時にチェック
export default function FreemiumGate({ children, onBlock }: FreemiumGateProps) {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/api/plan-check")
      .then((res) => res.json())
      .then(setPlanInfo)
      .catch(() => {});
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (planInfo?.isOver) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
      onBlock?.();
    }
  };

  return (
    <>
      <div onClick={handleClick}>{children}</div>
      {showModal && planInfo && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[15px] font-semibold mb-3">
              区画数の上限に達しました
            </h2>
            <p className="text-[13px] text-ink-2 mb-4">
              現在 {planInfo.currentUnits}区画を管理中です。
              フリープランの上限（{planInfo.maxUnits}区画）を超えているため、新しい部屋を追加できません。
            </p>
            <p className="text-[13px] text-ink-3 mb-6">
              既存データの閲覧・編集は引き続き可能です。
            </p>
            <div className="card p-4 mb-6 bg-accent-tint">
              <p className="text-[13px] font-medium text-accent mb-1">プロプランにアップグレード</p>
              <p className="text-[12px] text-ink-3">
                50区画まで対応。月額¥5,000（税込）から。
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
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
