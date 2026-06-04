"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { dispatchAuditLogRefresh } from "@/lib/audit-events";

function bankAccountTypeLabel(t: string | null | undefined): string {
  return t === "savings" ? "貯蓄" : t === "checking" ? "当座" : "普通";
}

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
  const [calcLoading, setCalcLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [manualOverride, setManualOverride] = useState(false);
  const [calcResult, setCalcResult] = useState<Record<string, any> | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  // オーナーへ請求する不足分の入金先（管理会社の既定口座）
  const [companyBank, setCompanyBank] = useState<Record<string, any> | null>(null);

  const isEdit = !!editData;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch("/api/bank-accounts")
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => {
        if (!cancelled && Array.isArray(list) && list.length > 0) setCompanyBank(list[0]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const formRef = useRef<HTMLFormElement>(null);
  // 編集対象が切り替わった時のみフォーム状態をリセットする。
  // 同じ対象の閉じ直しでは入力を保持して、誤クローズで内容を失わないようにする。
  const lastTargetRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const target = editData?.id ?? "__new__";
    if (lastTargetRef.current === target) return;
    lastTargetRef.current = target;

    if (editData) {
      setManualOverride(editData.manual_override || false);
      setCalcResult(null);
    } else {
      setManualOverride(false);
      setCalcResult(null);
      setSelectedOwnerId("");
      setSelectedMonth("");
    }
    setApiError("");
    formRef.current?.reset();
  }, [isOpen, editData]);

  async function handleCalc(ownerId?: string, month?: string) {
    const oId = ownerId || selectedOwnerId;
    const m = month || selectedMonth || defaultMonth;
    if (!oId || !m) {
      setApiError("オーナーと対象月を選択してください");
      return;
    }
    setCalcLoading(true);
    setApiError("");
    try {
      const res = await fetch(`/api/remittances/calc?owner_id=${oId}&month=${m}-01`);
      if (res.ok) {
        const data = await res.json();
        setCalcResult(data);
      } else {
        const err = await res.json();
        setApiError(err.error || "計算に失敗しました");
      }
    } catch {
      setApiError("計算処理でエラーが発生しました");
    } finally {
      setCalcLoading(false);
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
      // 登録/更新が完了したらドラフトをリセット
      lastTargetRef.current = null;
      formRef.current?.reset();
      onClose();
      router.refresh();
      dispatchAuditLogRefresh();
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
      style={{ display: isOpen ? "flex" : "none" }}
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

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {!isEdit ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">
                    オーナー <span className="text-danger">*</span>
                  </label>
                  <select
                    name="owner_id"
                    className="input"
                    value={selectedOwnerId}
                    onChange={(e) => {
                      setSelectedOwnerId(e.target.value);
                      setCalcResult(null);
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
                    value={selectedMonth || defaultMonth}
                    className="input"
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setCalcResult(null);
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCalc()}
                disabled={calcLoading || (!selectedOwnerId)}
                className="w-full bg-accent/10 text-accent font-medium rounded-lg px-4 py-2 text-sm hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {calcLoading ? "計算中..." : "自動計算"}
              </button>
            </>
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
                <span className="text-ink-3">費用控除</span>
                <span className="text-warn tabular-nums">
                  {Number(editData?.expense_deducted) > 0 ? `-¥${Number(editData?.expense_deducted).toLocaleString()}` : "—"}
                </span>
              </div>
              {Number(editData?.carryover_from_prev) > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-3">前月繰越（未収金）</span>
                  <span className="text-warn tabular-nums">-¥{Number(editData?.carryover_from_prev).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-medium border-t border-line pt-1 mt-1">
                <span>送金額</span>
                <span className="tabular-nums">¥{Number(editData?.net_amount).toLocaleString()}</span>
              </div>
              {Number(editData?.carryover_to_next) > 0 && (
                <div className="flex justify-between text-warn">
                  <span>オーナーへ請求（不足分）</span>
                  <span className="tabular-nums">¥{Number(editData?.carryover_to_next).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {calcResult && !isEdit && (
            <div className="bg-bg-2 rounded-lg p-3 text-[13px] space-y-1">
              <p className="text-xs font-medium text-ink-3 mb-2">自動計算結果（プレビュー）</p>
              <div className="flex justify-between">
                <span className="text-ink-3">家賃収入</span>
                <span className="tabular-nums">¥{Number(calcResult.total_rent).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">管理手数料</span>
                <span className="text-danger tabular-nums">
                  {Number(calcResult.management_fee_deducted) > 0 ? `-¥${Number(calcResult.management_fee_deducted).toLocaleString()}` : "¥0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">費用控除（{calcResult.expense_count}件）</span>
                <span className="text-warn tabular-nums">
                  {Number(calcResult.expense_deducted) > 0 ? `-¥${Number(calcResult.expense_deducted).toLocaleString()}` : "¥0"}
                </span>
              </div>
              {Number(calcResult.carryover_from_prev) > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-3">前月繰越（未収金）</span>
                  <span className="text-warn tabular-nums">-¥{Number(calcResult.carryover_from_prev).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-medium border-t border-line pt-1 mt-1">
                <span>送金額</span>
                <span className="tabular-nums">¥{Number(calcResult.net_amount).toLocaleString()}</span>
              </div>
              {Number(calcResult.carryover_to_next) > 0 && (
                <div className="text-warn text-xs mt-1 px-2 py-1 bg-warn-tint rounded space-y-0.5">
                  <div>
                    ※ 費用が家賃収入を超過。不足分 ¥{Number(calcResult.carryover_to_next).toLocaleString()} はオーナーへ請求します
                  </div>
                  {companyBank && (
                    <div className="text-ink-3">
                      入金先: {companyBank.bank_name} {companyBank.branch_name}{" "}
                      {bankAccountTypeLabel(companyBank.account_type)} {companyBank.account_number}（
                      {companyBank.account_holder}）
                    </div>
                  )}
                </div>
              )}
              {calcResult.property_breakdown?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-line space-y-0.5">
                  <p className="text-xs text-ink-3">物件別内訳</p>
                  {calcResult.property_breakdown.map((p: { name: string; rent: number; fee: number }, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-ink-3 truncate mr-2">{p.name}</span>
                      <span className="tabular-nums whitespace-nowrap">
                        ¥{p.rent.toLocaleString()}（手数料 ¥{p.fee.toLocaleString()}）
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
              className="btn btn-primary disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "保存中..." : isEdit ? "更新する" : "作成する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
