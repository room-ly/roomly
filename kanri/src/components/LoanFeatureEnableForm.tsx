"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoanFeatureEnableForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enable() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loan_feature_enabled: true }),
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
      <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12, lineHeight: 1.7 }}>
        自社所有物件のアパートローンを登録し、返済予定表（償還予定表）を取り込んで毎月の元金・利息・残高を管理できます。
        繰上返済や金利改定があった場合は手動で編集できます。
        <br />
        受託管理のみの会社（オーナーのローンは管轄外）では不要です。
      </p>
      <button
        type="button"
        className="btn btn-primary btn-sm flex items-center gap-1.5"
        disabled={loading}
        onClick={enable}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "保存中..." : "ローン機能をオンにする"}
      </button>
    </div>
  );
}
