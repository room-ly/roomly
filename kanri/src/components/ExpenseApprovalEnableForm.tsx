"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ApproverCandidate {
  id: string;
  name: string;
}

interface Props {
  approverCandidates: ApproverCandidate[];
}

export default function ExpenseApprovalEnableForm({ approverCandidates }: Props) {
  const router = useRouter();
  const [threshold, setThreshold] = useState("50000");
  const [approverId, setApproverId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enable() {
    if (!threshold || Number(threshold) <= 0 || !approverId) {
      setError("しきい値と承認者を指定してください");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_approval_threshold: Number(threshold),
          default_approver_user_id: approverId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "設定の保存に失敗しました");
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: 11,
              color: "var(--ink-3)",
              marginBottom: 4,
            }}
          >
            承認が必要な金額（円以上）
          </label>
          <input
            type="number"
            className="input"
            min={1}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="例: 50000"
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 11,
              color: "var(--ink-3)",
              marginBottom: 4,
            }}
          >
            既定の承認者
          </label>
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
      <button
        type="button"
        className="btn btn-primary btn-sm flex items-center gap-1.5"
        disabled={loading}
        onClick={enable}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "保存中..." : "稟議をオンにする"}
      </button>
      <p style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8 }}>
        会社全体に適用されます。物件ごとの承認者は物件設定で個別指定できます。
      </p>
    </div>
  );
}
