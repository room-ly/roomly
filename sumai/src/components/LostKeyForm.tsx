"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Key, Send, AlertTriangle } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function LostKeyForm({ contract }: { contract: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/maintenance-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract_id: contract.id,
        title: "鍵の紛失",
        category: "key_lost",
        description: description || "鍵を紛失しました。対応をお願いします。",
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "送信に失敗しました");
      setLoading(false);
      return;
    }

    router.push("/lost-key/complete");
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-line px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/" className="text-ink-3 hover:text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-semibold text-sm">鍵の紛失届</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="card p-4 bg-warn-tint/50 border-warn/20 flex items-start gap-3">
          <AlertTriangle size={20} className="text-warn shrink-0 mt-0.5" />
          <div className="text-sm text-ink-2 space-y-1">
            <p className="font-medium text-ink">鍵を紛失された場合</p>
            <p>管理会社に連絡が届き、鍵の交換・再発行を手配します。費用が発生する場合があります。</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-accent" />
            <h2 className="text-sm font-semibold">紛失届の送信</h2>
          </div>

          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-ink-3">物件名</span>
              <span className="font-medium">{contract.unit?.property?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-3">部屋番号</span>
              <span className="font-medium">{contract.unit?.unit_number ?? "—"}号室</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">状況の説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="いつ・どこで紛失したか、スペアキーの有無など"
              className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white py-2.5 rounded-xl text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
          >
            {loading ? "送信中..." : "紛失届を送信"}
            {!loading && <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
