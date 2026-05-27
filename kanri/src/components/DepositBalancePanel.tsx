"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { computeDepositBalance, type DepositTx } from "@/lib/deposit-calc";

type Tx = DepositTx & {
  id: string;
  occurred_at: string;
  notes?: string | null;
};

interface Props {
  contractId: string;
  initialDeposit: number;
  transactions: Tx[];
  /** 追加請求対象の expense_id（経費詳細から呼ばれる場合） */
  expenseId?: string;
  /** 追加請求ボタンを表示するか（経費に紐づいているときのみ true） */
  showAdditionalBilling?: boolean;
}

export default function DepositBalancePanel({
  contractId: _contractId,
  initialDeposit,
  transactions,
  expenseId,
  showAdditionalBilling = false,
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

  const summary = computeDepositBalance(initialDeposit, transactions);
  const negative = summary.balance < 0;
  const deficit = Math.max(0, -summary.balance);

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

        {transactions.length > 0 && (
          <table className="tbl" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>日付</th>
                <th>種別</th>
                <th style={{ textAlign: "right" }}>金額</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="mono">{t.occurred_at}</td>
                  <td>
                    {t.transaction_type === "charge" && (
                      <span className="charge-tag danger">取崩し</span>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
