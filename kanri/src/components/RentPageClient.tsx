"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import RentPaymentModal from "./RentPaymentModal";
import RentCsvImportModal from "./RentCsvImportModal";
import { usePermission } from "@/lib/use-permission";

interface BillingInfo {
  id: string;
  total_amount: number;
  paid_amount: number;
  tenant_name: string;
  unit_label: string;
  billing_month: string;
}

interface RentPaymentButtonProps {
  billing: BillingInfo;
}

export function RentPaymentButton({ billing }: RentPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canEdit = usePermission("rent:edit");

  if (!canEdit) return null;

  return (
    <span onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="btn btn-primary text-[11px] px-2 py-1"
      >
        入金登録
      </button>
      <RentPaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        billing={billing}
      />
    </span>
  );
}

export function CsvImportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const canEdit = usePermission("rent:edit");

  if (!canEdit) return null;

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="btn btn-secondary"
      >
        入金消込
      </button>
      <RentCsvImportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

// デフォルトの対象月（翌月の1日）を返す
function getDefaultBillingMonth(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString().slice(0, 7); // YYYY-MM
}

export function BulkGenerateButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "loading" | "done">("confirm");
  const [month, setMonth] = useState(getDefaultBillingMonth);
  const [result, setResult] = useState<{
    generated: number;
    skipped: number;
    message?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const canCreate = usePermission("rent:create");

  function handleClose() {
    setIsOpen(false);
    setStep("confirm");
    setResult(null);
    setError("");
    setMonth(getDefaultBillingMonth());
    if (result && result.generated > 0) {
      router.refresh();
    }
  }

  async function handleGenerate() {
    setError("");
    setStep("loading");

    try {
      const res = await fetch("/api/rent-billings/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing_month: `${month}-01` }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        setStep("confirm");
        return;
      }
      setResult(data);
      setStep("done");
    } catch {
      setError("請求の一括生成に失敗しました");
      setStep("confirm");
    }
  }

  if (!canCreate) return null;

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="btn btn-primary"
      >
        一括請求生成
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-line">
              <h2 className="text-[15px] font-semibold">
                {step === "done" ? "一括請求生成完了" : "家賃一括請求生成"}
              </h2>
              <button
                onClick={handleClose}
                className="text-ink-3 hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
                  {error}
                </div>
              )}

              {step === "confirm" && (
                <>
                  <p className="text-[13px] text-ink-2 mb-4">
                    有効な契約すべてに対して、指定月の家賃請求を一括生成します。既に請求が存在する契約はスキップされます。
                  </p>
                  <label className="block text-[13px] font-medium text-ink mb-1">
                    対象月
                  </label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                  <p className="text-[11px] text-ink-4 mb-6">
                    支払期限は翌月末日に設定されます
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={(step as "confirm" | "loading" | "done") === "loading"}
                      className="btn btn-primary disabled:opacity-50 disabled:cursor-wait"
                    >
                      生成する
                    </button>
                  </div>
                </>
              )}

              {step === "loading" && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-sm text-ink-2">請求を生成中...</p>
                </div>
              )}

              {step === "done" && result && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {result.generated}件の請求を生成しました
                  </h3>
                  {result.skipped > 0 && (
                    <p className="text-sm text-ink-3">
                      {result.skipped}件はスキップ（既に請求済み）
                    </p>
                  )}
                  {result.message && (
                    <p className="text-sm text-ink-3 mt-1">{result.message}</p>
                  )}
                  <button
                    onClick={handleClose}
                    className="btn btn-primary mt-6"
                  >
                    閉じる
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
