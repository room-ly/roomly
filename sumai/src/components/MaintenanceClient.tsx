"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Wrench, Send, X } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const statusLabel: Record<string, { text: string; cls: string }> = {
  open: { text: "未対応", cls: "bg-warn-tint text-warn" },
  in_progress: { text: "対応中", cls: "bg-accent-tint text-accent" },
  completed: { text: "完了", cls: "bg-success-tint text-success" },
  cancelled: { text: "取消", cls: "bg-bg-2 text-ink-3" },
};

const categories = [
  { value: "plumbing", label: "水まわり" },
  { value: "electrical", label: "電気" },
  { value: "equipment", label: "設備" },
  { value: "structural", label: "建物" },
  { value: "other", label: "その他" },
];

export default function MaintenanceClient({
  contract,
  requests,
}: {
  contract: any | null;
  requests: any[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "other",
    description: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contract) return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/maintenance-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract_id: contract.id,
        ...form,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "送信に失敗しました");
      setLoading(false);
      return;
    }

    router.push("/maintenance/complete");
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-line px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-ink-3 hover:text-ink transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-semibold text-sm">修理依頼</h1>
          </div>
          {!showForm && contract && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-xs text-accent font-medium"
            >
              <Plus size={14} />
              新規依頼
            </button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {showForm && (
          <form onSubmit={handleSubmit} className="card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Wrench size={14} className="text-accent" />
                新規修理依頼
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-ink-3 hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                件名 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="例: キッチンの水漏れ"
                className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">カテゴリ</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">詳細</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                placeholder="状況を詳しく教えてください"
                className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !form.title}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white py-2.5 rounded-xl text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
            >
              {loading ? "送信中..." : "送信"}
              {!loading && <Send size={16} />}
            </button>
          </form>
        )}

        {!contract && (
          <div className="card p-5 text-center text-sm text-ink-3">
            有効な契約がないため、修理依頼はできません
          </div>
        )}

        {requests.length === 0 && !showForm ? (
          <div className="card p-8 text-center text-sm text-ink-3">
            <Wrench size={24} className="mx-auto mb-2 text-ink-4" />
            修理依頼はありません
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-line">
              <h2 className="text-sm font-semibold">依頼履歴（{requests.length}件）</h2>
            </div>
            {requests.map((req: any) => {
              const s = statusLabel[req.status] ?? statusLabel.open;
              return (
                <div key={req.id} className="px-4 py-3 border-b border-line last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{req.title}</p>
                      {req.description && (
                        <p className="text-xs text-ink-3 mt-1 line-clamp-2">{req.description}</p>
                      )}
                      <p className="text-xs text-ink-4 mt-1">{req.reported_date}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${s.cls}`}>
                      {s.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
