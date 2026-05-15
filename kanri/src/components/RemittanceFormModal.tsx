"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface OwnerOption {
  id: string;
  name: string;
}

interface RemittanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  owners: OwnerOption[];
  editData?: Record<string, any> | null;
}

export default function RemittanceFormModal({
  isOpen,
  onClose,
  owners,
  editData,
}: RemittanceFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [manualOverride, setManualOverride] = useState(false);
  const [calcResult, setCalcResult] = useState<Record<string, any> | null>(null);

  const isEdit = !!editData;

  useEffect(() => {
    if (editData) {
      setManualOverride(editData.manual_override || false);
      setCalcResult(null);
    } else {
      setManualOverride(false);
      setCalcResult(null);
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  async function handleCalc(ownerId: string, month: string) {
    if (!ownerId || !month) return;
    try {
      const res = await fetch(`/api/remittances/calc?owner_id=${ownerId}&month=${month}-01`);
      if (res.ok) {
        const data = await res.json();
        setCalcResult(data);
      }
    } catch {
      // 計算API未実装の場合は無視
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError("");

    const fd = new FormData(e.currentTarget);
    const ownerId = fd.get("owner_id") as string;
    const month = fd.get("remittance_month") as string;
    const paymentMethod = fd.get("payment_method") as string;
    const status = fd.get("status") as string;
    const notes = fd.get("notes") as string;
    const manualNet = fd.get("manual_net_amount") as string;

    if (!isEdit && (!ownerId || !month)) {
      setApiError("オーナーと対象月は必須です");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const body: Record<string, unknown> = {
          status,
          payment_method: paymentMethod,
          notes: notes || null,
          manual_override: manualOverride,
        };
        if (manualOverride && manualNet) {
          body.manual_net_amount = Number(manualNet);
          body.net_amount = Number(manualNet);
        } else {
          body.manual_net_amount = null;
          body.manual_override = false;
        }
        const res = await fetch(`/api/remittances/${editData!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          setApiError(err.error || "更新に失敗しました");
          return;
        }
      } else {
        const body: Record<string, unknown> = {
          owner_id: ownerId,
          remittance_month: `${month}-01`,
          payment_method: paymentMethod,
        };
        if (manualOverride && manualNet) {
          body.manual_net_amount = Number(manualNet);
        }
        const res = await fetch("/api/remittances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          setApiError(err.error || "作成に失敗しました");
          return;
        }
      }
      onClose();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const defaultMonth = editData
    ? editData.remittance_month?.slice(0, 7)
    : new Date().toISOString().slice(0, 7);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold">
            {isEdit ? "送金を編集" : "送金を作成"}
          </h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {apiError && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  オーナー <span className="text-danger">*</span>
                </label>
                <select
                  name="owner_id"
                  className="input"
                  onChange={(e) => {
                    const monthInput = document.querySelector<HTMLInputElement>('input[name="remittance_month"]');
                    if (monthInput?.value) handleCalc(e.target.value, monthInput.value);
                  }}
                >
                  <option value="">選択してください</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  対象月 <span className="text-danger">*</span>
                </label>
                <input
                  name="remittance_month"
                  type="month"
                  defaultValue={defaultMonth}
                  className="input"
                  onChange={(e) => {
                    const ownerSelect = document.querySelector<HTMLSelectElement>('select[name="owner_id"]');
                    if (ownerSelect?.value) handleCalc(ownerSelect.value, e.target.value);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">オーナー</label>
                <p className="text-sm py-2 px-3 bg-bg-2 rounded-lg">{editData?.owner?.name ?? "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">対象月</label>
                <p className="text-sm py-2 px-3 bg-bg-2 rounded-lg">{editData?.remittance_month?.slice(0, 7)}</p>
              </div>
            </div>
          )}

          {isEdit && (
            <div className="bg-bg-2 rounded-lg p-3 text-[13px] space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-3">家賃収入</span>
                <span className="tabular-nums">¥{Number(editData?.total_rent).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">管理手数料</span>
                <span className="text-danger tabular-nums">-¥{Number(editData?.management_fee_deducted).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">経費控除</span>
                <span className="text-warn tabular-nums">
                  {Number(editData?.expense_deducted) > 0 ? `-¥${Number(editData?.expense_deducted).toLocaleString()}` : "—"}
                </span>
              </div>
              <div className="flex justify-between font-medium border-t border-line pt-1 mt-1">
                <span>自動計算額</span>
                <span className="tabular-nums">
                  ¥{(Number(editData?.total_rent) - Number(editData?.management_fee_deducted) - Number(editData?.expense_deducted)).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {calcResult && !isEdit && (
            <div className="bg-bg-2 rounded-lg p-3 text-[13px] space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-3">家賃収入（自動計算）</span>
                <span className="tabular-nums">¥{Number(calcResult.total_rent).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>送金額</span>
                <span className="tabular-nums">¥{Number(calcResult.net_amount).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">送金方法</label>
              <select
                name="payment_method"
                defaultValue={editData?.payment_method || "transfer"}
                className="input"
              >
                <option value="transfer">振込</option>
                <option value="cash">現金</option>
              </select>
            </div>
            {isEdit && (
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">状態</label>
                <select
                  name="status"
                  defaultValue={editData?.status || "draft"}
                  className="input"
                >
                  <option value="draft">下書き</option>
                  <option value="confirmed">確定</option>
                  <option value="sent">送金済</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={manualOverride}
                onChange={(e) => setManualOverride(e.target.checked)}
                className="rounded border-line"
              />
              <span className="text-sm text-ink-2">送金額を手動で指定する</span>
            </label>
          </div>

          {manualOverride && (
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                手動送金額 <span className="text-danger">*</span>
              </label>
              <input
                name="manual_net_amount"
                type="number"
                defaultValue={editData?.manual_net_amount ?? ""}
                className="input"
                placeholder="例: 150000"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">メモ</label>
            <textarea
              name="notes"
              defaultValue={editData?.notes || ""}
              className="input min-h-[60px]"
              placeholder="備考があれば入力..."
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
              {loading ? "保存中..." : isEdit ? "更新する" : "作成する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
