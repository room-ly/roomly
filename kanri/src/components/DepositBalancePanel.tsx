"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { computeDepositBalance, type DepositTx } from "@/lib/deposit-calc";

type Tx = DepositTx & {
  id: string;
  occurred_at: string;
  notes?: string | null;
  expense_id?: string | null;
  billing_id?: string | null;
  reason?: string | null;
};

interface Props {
  contractId: string;
  initialDeposit: number;
  transactions: Tx[];
  /** 追加請求対象の expense_id（経費詳細から呼ばれる場合） */
  expenseId?: string;
  /** 追加請求ボタンを表示するか（経費に紐づいているときのみ true） */
  showAdditionalBilling?: boolean;
  /** 取崩し/返金を手動記録できるUIを出すか（契約詳細から呼ばれる場合 true） */
  allowManualEntry?: boolean;
}

const MANUAL_TYPES = [
  { value: "charge", label: "取崩し", hint: "原状回復費・未払い家賃の充当など" },
  { value: "refund", label: "返金", hint: "退去時に残額を返金" },
  { value: "initial_deposit", label: "追加預り", hint: "敷金を追加で預かった" },
] as const;

// 取崩しの理由。原状回復費は費用(経費)と紐づきうるが、未払い家賃・違約金の充当は費用にならない。
const CHARGE_REASONS = [
  { value: "restoration", label: "原状回復費" },
  { value: "unpaid_rent", label: "未払い家賃の充当" },
  { value: "penalty", label: "違約金・遅延損害金" },
  { value: "other", label: "その他" },
] as const;
const REASON_LABEL: Record<string, string> = Object.fromEntries(
  CHARGE_REASONS.map((r) => [r.value, r.label]),
);

export default function DepositBalancePanel({
  contractId,
  initialDeposit,
  transactions,
  expenseId,
  showAdditionalBilling = false,
  allowManualEntry = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [billingMonth, setBillingMonth] = useState(
    new Date().toISOString().slice(0, 7) + "-01",
  );
  const [error, setError] = useState("");

  // 手動記録フォーム
  const [showManual, setShowManual] = useState(false);
  const [manualType, setManualType] = useState<(typeof MANUAL_TYPES)[number]["value"]>("charge");
  const [manualReason, setManualReason] =
    useState<(typeof CHARGE_REASONS)[number]["value"]>("restoration");
  const [manualAmount, setManualAmount] = useState(0);
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
  const [manualNotes, setManualNotes] = useState("");
  const [manualError, setManualError] = useState("");

  const summary = computeDepositBalance(initialDeposit, transactions);
  const negative = summary.balance < 0;
  const deficit = Math.max(0, -summary.balance);

  async function recordManual() {
    setLoading(true);
    setManualError("");
    try {
      const res = await fetch(`/api/contracts/${contractId}/deposit-transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_type: manualType,
          amount: manualAmount,
          occurred_at: manualDate,
          notes: manualNotes || null,
          reason: manualType === "charge" ? manualReason : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setManualError(err.error || "記録に失敗しました");
      } else {
        setShowManual(false);
        setManualAmount(0);
        setManualNotes("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteManual(txId: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/contracts/${contractId}/deposit-transactions?txId=${txId}`,
        { method: "DELETE" },
      );
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function createBilling() {
    if (!expenseId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/expenses/${expenseId}/additional-billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          due_date: dueDate,
          billing_month: billingMonth,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "請求作成に失敗しました");
      } else {
        setShowForm(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section">
      <div className="section-head-bar">
        <h2>敷金残高</h2>
        {allowManualEntry && !showManual && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setShowManual(true);
              setManualError("");
            }}
          >
            取崩し・返金を記録
          </button>
        )}
      </div>
      <div className="section-body">
        <div className="cols-summary" style={{ marginBottom: 16 }}>
          <div className="sum-card">
            <span className="sum-label mono">初期敷金</span>
            <span className="sum-value">¥{summary.initial.toLocaleString()}</span>
          </div>
          <div className="sum-card">
            <span className="sum-label mono">取崩し</span>
            <span className="sum-value" style={{ color: "var(--danger)" }}>
              -¥{summary.charged.toLocaleString()}
            </span>
          </div>
          <div className="sum-card">
            <span className="sum-label mono">返金</span>
            <span className="sum-value">¥{summary.refunded.toLocaleString()}</span>
          </div>
          <div
            className="sum-card sum-card-em"
            style={{ borderLeft: `3px solid ${negative ? "var(--danger)" : "var(--accent)"}` }}
          >
            <span className="sum-label mono">残高</span>
            <span
              className="sum-value"
              style={{ color: negative ? "var(--danger)" : "var(--accent-deep)" }}
            >
              ¥{summary.balance.toLocaleString()}
            </span>
          </div>
        </div>

        {negative && (
          <div
            style={{
              padding: "8px 12px",
              background: "var(--danger-tint, #fee2e2)",
              borderLeft: "3px solid var(--danger)",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            敷金が ¥{deficit.toLocaleString()} 不足しています。
            {showAdditionalBilling && expenseId && !showForm && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginLeft: 12 }}
                onClick={() => {
                  setAmount(deficit);
                  setShowForm(true);
                }}
              >
                追加請求を作成
              </button>
            )}
          </div>
        )}

        {showForm && (
          <div className="border border-line rounded-lg p-3 mb-3">
            {error && (
              <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-3">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              <div>
                <label className="text-[11px] text-ink-3 block mb-1">請求金額</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="input"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-3 block mb-1">請求月</label>
                <input
                  type="month"
                  value={billingMonth.slice(0, 7)}
                  onChange={(e) => setBillingMonth(`${e.target.value}-01`)}
                  className="input"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-3 block mb-1">支払期日</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={createBilling}
                disabled={loading || amount <= 0 || !dueDate}
              >
                {loading ? "作成中..." : "請求を作成"}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowForm(false)}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {showManual && (
          <div className="border border-line rounded-lg p-3 mb-3">
            {manualError && (
              <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-3">
                {manualError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              <div>
                <label className="text-[11px] text-ink-3 block mb-1">種別</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as typeof manualType)}
                  className="input"
                >
                  {MANUAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-ink-3 block mb-1">金額</label>
                <input
                  type="number"
                  value={manualAmount || 0}
                  onChange={(e) => setManualAmount(Number(e.target.value) || 0)}
                  className="input"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-3 block mb-1">日付</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>
            {manualType === "charge" && (
              <div className="mb-2">
                <label className="text-[11px] text-ink-3 block mb-1">取崩しの理由</label>
                <select
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value as typeof manualReason)}
                  className="input"
                >
                  {CHARGE_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {manualReason === "restoration" && (
                  <p className="text-[10px] text-ink-3 mt-1">
                    原状回復費は業者への支払いを費用としても記録すると、収支に正しく反映されます。
                  </p>
                )}
              </div>
            )}
            <div className="mb-2">
              <label className="text-[11px] text-ink-3 block mb-1">内容（任意）</label>
              <input
                type="text"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder={MANUAL_TYPES.find((t) => t.value === manualType)?.hint}
                className="input"
              />
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={recordManual}
                disabled={loading || manualAmount <= 0 || !manualDate}
              >
                {loading ? "記録中..." : "記録する"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowManual(false)}>
                キャンセル
              </button>
            </div>
          </div>
        )}

        {transactions.length > 0 && (
          <table className="tbl" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>日付</th>
                <th>種別</th>
                <th style={{ textAlign: "right" }}>金額</th>
                <th>内容</th>
                {allowManualEntry && <th></th>}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const isManual = !t.expense_id && !t.billing_id;
                return (
                  <tr key={t.id}>
                    <td className="mono">{t.occurred_at}</td>
                    <td>
                      {t.transaction_type === "charge" && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="charge-tag danger">取崩し</span>
                          {t.reason && REASON_LABEL[t.reason] && (
                            <span className="text-[11px] text-ink-3">
                              {REASON_LABEL[t.reason]}
                            </span>
                          )}
                        </span>
                      )}
                      {t.transaction_type === "refund" && (
                        <span className="charge-tag accent">返金</span>
                      )}
                      {t.transaction_type === "additional_billing" && (
                        <span className="charge-tag warn">追加請求</span>
                      )}
                      {t.transaction_type === "initial_deposit" && (
                        <span className="charge-tag">初期入金</span>
                      )}
                    </td>
                    <td className="num">¥{Number(t.amount).toLocaleString()}</td>
                    <td style={{ color: "var(--ink-2)" }}>{t.notes || "—"}</td>
                    {allowManualEntry && (
                      <td style={{ textAlign: "right" }}>
                        {isManual && (
                          <button
                            className="text-[11px] text-danger hover:underline"
                            onClick={() => deleteManual(t.id)}
                            disabled={loading}
                            title="この記録を削除"
                          >
                            削除
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
