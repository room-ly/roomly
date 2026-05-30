"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ApproverCandidate {
  id: string;
  name: string;
}

interface Props {
  expenseId: string;
  status: string;
  isApprover: boolean;
  approverName: string | null;
  approverSource: "property" | "company" | null;
  // 稟議機能のON/OFF制御
  approvalEnabled: boolean;
  currentThreshold: number | null;
  currentApproverId: string | null;
  approverCandidates: ApproverCandidate[];
  canEditSettings: boolean;
}

export default function ExpenseApprovalPanel({
  expenseId,
  status,
  isApprover,
  approverName,
  approverSource,
  approvalEnabled,
  currentThreshold,
  currentApproverId,
  approverCandidates,
  canEditSettings,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState("");
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [threshold, setThreshold] = useState<string>(
    currentThreshold != null ? String(currentThreshold) : "50000",
  );
  const [approverId, setApproverId] = useState<string>(currentApproverId ?? "");

  async function saveSettings(nextThreshold: number | null, nextApproverId: string | null) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_approval_threshold: nextThreshold,
          default_approver_user_id: nextApproverId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "設定の保存に失敗しました");
      } else {
        setShowEnableModal(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  // OFF状態: トグル + ON切替モーダル
  if (!approvalEnabled) {
    return (
      <div className="section">
        <div className="section-head-bar">
          <h2>稟議</h2>
        </div>
        <div className="section-body">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-ink-2 mb-1">
                稟議機能は<strong>オフ</strong>です。経費はそのまま登録され、承認フローは走りません。
              </p>
              <p className="text-xs text-ink-3">
                オンにすると、指定金額以上のオーナー負担経費は承認待ちになり、承認者の操作が必要になります。
              </p>
            </div>
            {canEditSettings ? (
              <button
                className="btn btn-ghost btn-sm whitespace-nowrap"
                onClick={() => setShowEnableModal(true)}
              >
                稟議をオンにする
              </button>
            ) : (
              <span className="text-xs text-ink-3 whitespace-nowrap">
                管理者のみ変更可能
              </span>
            )}
          </div>

          {showEnableModal && (
            <div className="mt-4 border-t pt-4">
              {error && (
                <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-3">
                  {error}
                </div>
              )}
              <div className="kv-grid">
                <div className="field">
                  <label className="field-label mono">承認が必要な金額（円以上）</label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="例: 50000"
                  />
                </div>
                <div className="field">
                  <label className="field-label mono">既定の承認者</label>
                  <select
                    className="input"
                    value={approverId}
                    onChange={(e) => setApproverId(e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {approverCandidates.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="btn btn-primary btn-sm disabled:cursor-wait flex items-center gap-1.5"
                  disabled={loading || !threshold || Number(threshold) <= 0 || !approverId}
                  onClick={() => saveSettings(Number(threshold), approverId)}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "保存中..." : "オンにする"}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setShowEnableModal(false);
                    setError("");
                  }}
                  disabled={loading}
                >
                  キャンセル
                </button>
              </div>
              <p className="text-xs text-ink-3 mt-2">
                ここで設定した内容は会社全体に適用されます。物件ごとの承認者は物件設定から個別に指定できます。
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

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
        {canEditSettings && (
          <button
            className="btn btn-ghost btn-xs ml-auto"
            onClick={() => saveSettings(null, null)}
            disabled={loading}
            title="稟議機能をオフにする"
          >
            稟議をオフにする
          </button>
        )}
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
            <button className="btn btn-primary btn-sm disabled:cursor-wait flex items-center gap-1.5" onClick={submit} disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
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
                <button className="btn btn-primary btn-sm disabled:cursor-wait flex items-center gap-1.5" onClick={approve} disabled={loading}>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "承認中..." : "承認する"}
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
                  <button className="btn btn-primary btn-sm disabled:cursor-wait flex items-center gap-1.5" onClick={reject} disabled={loading}>
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    {loading ? "却下中..." : "却下を確定"}
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
