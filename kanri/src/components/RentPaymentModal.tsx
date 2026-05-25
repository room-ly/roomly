"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { rentPaymentSchema, type RentPaymentFormData } from "@/lib/schemas";
import type { ZodError } from "zod";

interface RentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  billing: {
    id: string;
    total_amount: number;
    paid_amount: number;
    tenant_name: string;
    unit_label: string;
    billing_month: string;
  };
  mode?: "payment" | "refund";
}

export default function RentPaymentModal({
  isOpen,
  onClose,
  billing,
  mode = "payment",
}: RentPaymentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");

  if (!isOpen) return null;

  const isRefund = mode === "refund";
  const remaining = billing.total_amount - billing.paid_amount;
  const overpaid = Math.max(0, billing.paid_amount - billing.total_amount);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    try {
      const parsed = rentPaymentSchema.parse(data) as RentPaymentFormData;
      setLoading(true);

      const res = await fetch(`/api/rent-billings/${billing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed, action: "payment" }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.details) {
          setErrors(err.details as Record<string, string[]>);
          setApiError("入力内容を確認してください");
        } else {
          setApiError(err.error || "エラーが発生しました");
        }
        return;
      }

      onClose();
      router.refresh();
    } catch (err) {
      const zodErr = err as ZodError;
      if (zodErr.flatten) {
        setErrors(zodErr.flatten().fieldErrors as Record<string, string[]>);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold">{isRefund ? "返金登録" : "入金登録"}</h2>
          <button
            onClick={onClose}
            className="text-ink-3 hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 請求情報サマリー */}
        <div className="bg-bg-2 rounded-lg p-3 mb-4 text-[13px]">
          <div className="flex justify-between mb-1">
            <span className="text-ink-3">入居者</span>
            <span className="font-medium">{billing.tenant_name}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-ink-3">部屋</span>
            <span>{billing.unit_label}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-ink-3">対象月</span>
            <span>{billing.billing_month}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-ink-3">請求額</span>
            <span className="tabular-nums">
              ¥{billing.total_amount.toLocaleString()}
            </span>
          </div>
          {billing.paid_amount > 0 && (
            <div className="flex justify-between mb-1">
              <span className="text-ink-3">入金済</span>
              <span className="text-accent-deep tabular-nums">
                ¥{billing.paid_amount.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-line">
            <span className="font-medium">{isRefund ? "超過額" : "未入金額"}</span>
            <span className={`font-semibold tabular-nums ${isRefund ? "text-blue-700" : "text-accent"}`}>
              ¥{isRefund ? overpaid.toLocaleString() : remaining.toLocaleString()}
            </span>
          </div>
        </div>

        {apiError && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              {isRefund ? "返金額" : "入金額"} <span className="text-danger">*</span>
            </label>
            <input
              name="amount"
              type="number"
              defaultValue={isRefund ? overpaid : remaining}
              className="input"
              placeholder="例: 80000"
            />
            {errors.amount && (
              <p className="text-danger text-sm mt-1">{errors.amount[0]}</p>
            )}
          </div>

          <div className={`grid grid-cols-1 ${isRefund ? "" : "sm:grid-cols-2"} gap-3`}>
            {isRefund ? (
              <input type="hidden" name="payment_method" value="refund" />
            ) : (
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  支払方法 <span className="text-danger">*</span>
                </label>
                <select name="payment_method" defaultValue="transfer" className="input">
                  <option value="transfer">銀行振込</option>
                  <option value="card">クレジットカード</option>
                  <option value="cash">現金</option>
                  <option value="debit">口座引落</option>
                </select>
                {errors.payment_method && (
                  <p className="text-danger text-sm mt-1">
                    {errors.payment_method[0]}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                {isRefund ? "返金日" : "入金日"} <span className="text-danger">*</span>
              </label>
              <input
                name="payment_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="input"
              />
              {errors.payment_date && (
                <p className="text-danger text-sm mt-1">
                  {errors.payment_date[0]}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              備考
            </label>
            <input
              name="note"
              className="input"
              placeholder="任意"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? "登録中..." : isRefund ? "返金を登録" : "入金を登録"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
