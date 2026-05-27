"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  expenseId: string;
  status: string;
  isApprover: boolean;
  approverName: string | null;
  approverSource: "property" | "company" | null;
}

export default function ExpenseApprovalPanel({ expenseId, status, isApprover, approverName, approverSource }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState("");

  if (status !== "pending_approval" && status !== "draft") return null;

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/expenses/${expenseId}/submit`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "提出に失敗しました");
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approve`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "承認に失敗しました");
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    if (!reason.trim()) {
      setError("却下理由を入力してください");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/expenses/${expenseId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejected_reason: reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "却下に失敗しました");
      } else {
        setShowReject(false);
        setReason("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section">
      <div className="section-head-bar">
        <h2>稟議</h2>
      </div>
      <div className="section-body">
        {error && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}
        {status === "draft" && (
          <div>
            <p className="text-sm text-ink-2 mb-2">
              下書き状態です。提出すると、しきい値超過時は承認待ちに、それ以外は自動承認されます。
            </p>
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
              {loading ? "送信中..." : "提出する"}
            </button>
          </div>
        )}
        {status === "pending_approval" && (
          <div>
            <p className="text-sm text-ink-2 mb-2">
              この経費は承認待ちです。
              {approverName ? (
                <>
                  承認者は <strong>{approverName}</strong>
                  {approverSource === "company" && <span className="text-ink-3">（会社デフォルト）</span>}
                  です。
                  {isApprover ? " 承認または却下してください。" : ""}
                </>
              ) : (
                "承認者が設定されていません。物件または会社設定で指定してください。"
              )}
            </p>
            {isApprover && !showReject && (
              <div className="flex gap-2">
                <button className="btn btn-primary btn-sm" onClick={approve} disabled={loading}>
                  承認する
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowReject(true)}
                  disabled={loading}
                >
                  却下する
                </button>
              </div>
            )}
            {isApprover && showReject && (
              <div>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="却下理由を入力"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-primary btn-sm" onClick={reject} disabled={loading}>
                    却下を確定
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setShowReject(false);
                      setReason("");
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
