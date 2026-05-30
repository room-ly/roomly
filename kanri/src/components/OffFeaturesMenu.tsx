"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

interface ApproverCandidate {
  id: string;
  name: string;
}

interface Props {
  // 稟議OFF状態
  approvalOff: boolean;
  canEditSettings: boolean;
  approverCandidates: ApproverCandidate[];
}

type ActiveFeature = null | "approval";

export default function OffFeaturesMenu({
  approvalOff,
  canEditSettings,
  approverCandidates,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ActiveFeature>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [threshold, setThreshold] = useState("50000");
  const [approverId, setApproverId] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setActive(null);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const offFeatures: { key: ActiveFeature; label: string; description: string; visible: boolean }[] =
    [
      {
        key: "approval",
        label: "稟議",
        description: "金額が一定以上の経費を承認待ちにする",
        visible: approvalOff,
      },
    ];
  const visibleFeatures = offFeatures.filter((f) => f.visible);

  if (visibleFeatures.length === 0) return null;

  async function enableApproval() {
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
        setOpen(false);
        setActive(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => {
          setOpen((v) => !v);
          setActive(null);
        }}
        title="この画面で使えるオプション機能"
      >
        <Plus size={14} style={{ marginRight: 4 }} />
        機能を追加
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            zIndex: 50,
            minWidth: 320,
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            padding: 8,
          }}
        >
          {active === null && (
            <>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  padding: "6px 8px",
                  letterSpacing: "0.05em",
                }}
              >
                オフ中の機能
              </div>
              {visibleFeatures.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className="off-feature-row"
                  onClick={() => {
                    if (!canEditSettings) return;
                    setActive(f.key);
                    setError("");
                  }}
                  disabled={!canEditSettings}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "none",
                    background: "transparent",
                    cursor: canEditSettings ? "pointer" : "not-allowed",
                    opacity: canEditSettings ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                    if (canEditSettings) e.currentTarget.style.background = "var(--bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                    {f.description}
                  </div>
                </button>
              ))}
              {!canEditSettings && (
                <div style={{ fontSize: 11, color: "var(--ink-3)", padding: "6px 8px" }}>
                  ※ 管理者のみオンにできます
                </div>
              )}
            </>
          )}

          {active === "approval" && (
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                稟議をオンにする
              </div>
              {error && (
                <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-2">
                  {error}
                </div>
              )}
              <div style={{ marginBottom: 8 }}>
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
              <div style={{ marginBottom: 8 }}>
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
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  disabled={loading}
                  onClick={enableApproval}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "保存中..." : "オンにする"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setActive(null);
                    setError("");
                  }}
                  disabled={loading}
                >
                  戻る
                </button>
              </div>
              <p style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8 }}>
                会社全体に適用されます。物件ごとの承認者は物件設定で個別指定できます。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
