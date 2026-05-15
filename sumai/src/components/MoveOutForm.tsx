"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Send } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function MoveOutForm({ contract }: { contract: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  const [form, setForm] = useState({
    desired_move_out_date: "",
    reason: "",
    forwarding_postal_code: "",
    forwarding_address: "",
    forwarding_phone: "",
    bank_name: "",
    bank_branch: "",
    bank_account_type: "普通",
    bank_account_number: "",
    bank_account_holder: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/move-out-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract_id: contract.id,
        ...form,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "申請に失敗しました");
      setLoading(false);
      return;
    }

    router.push("/move-out/complete");
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-line px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/" className="text-ink-3 hover:text-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-semibold text-sm">退去申請</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* 契約情報（確認用） */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={14} className="text-accent" />
            <span className="text-xs font-medium text-ink-3">対象契約</span>
          </div>
          <p className="text-sm font-medium">
            {contract.unit?.property?.name} {contract.unit?.unit_number}号室
          </p>
          <p className="text-xs text-ink-3 mt-1">{contract.unit?.property?.address}</p>
        </div>

        {/* 退去希望日 */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold">退去情報</h2>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              退去希望日 <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              required
              min={minDateStr}
              value={form.desired_move_out_date}
              onChange={(e) => update("desired_move_out_date", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <p className="text-xs text-ink-4 mt-1">通常1ヶ月以上先の日付を指定してください</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">退去理由</label>
            <textarea
              value={form.reason}
              onChange={(e) => update("reason", e.target.value)}
              rows={3}
              placeholder="転勤、住み替え等"
              className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
          </div>
        </div>

        {/* 転居先 */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold">転居先情報</h2>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">郵便番号</label>
            <input
              type="text"
              value={form.forwarding_postal_code}
              onChange={(e) => update("forwarding_postal_code", e.target.value)}
              placeholder="123-4567"
              className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">住所</label>
            <input
              type="text"
              value={form.forwarding_address}
              onChange={(e) => update("forwarding_address", e.target.value)}
              placeholder="東京都渋谷区..."
              className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">電話番号</label>
            <input
              type="tel"
              value={form.forwarding_phone}
              onChange={(e) => update("forwarding_phone", e.target.value)}
              placeholder="090-1234-5678"
              className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
        </div>

        {/* 敷金返還口座 */}
        <div className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold">敷金返還先口座</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">金融機関名</label>
              <input
                type="text"
                value={form.bank_name}
                onChange={(e) => update("bank_name", e.target.value)}
                placeholder="○○銀行"
                className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">支店名</label>
              <input
                type="text"
                value={form.bank_branch}
                onChange={(e) => update("bank_branch", e.target.value)}
                placeholder="○○支店"
                className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">口座種別</label>
            <select
              value={form.bank_account_type}
              onChange={(e) => update("bank_account_type", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              <option value="普通">普通</option>
              <option value="当座">当座</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">口座番号</label>
              <input
                type="text"
                value={form.bank_account_number}
                onChange={(e) => update("bank_account_number", e.target.value)}
                placeholder="1234567"
                className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">口座名義</label>
              <input
                type="text"
                value={form.bank_account_holder}
                onChange={(e) => update("bank_account_holder", e.target.value)}
                placeholder="ヤマダ タロウ"
                className="w-full px-3 py-2 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-danger-tint text-danger text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.desired_move_out_date}
          className="w-full flex items-center justify-center gap-2 bg-accent text-white py-3 rounded-xl text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "送信中..." : "退去申請を送信"}
          {!loading && <Send size={16} />}
        </button>

        <p className="text-xs text-ink-4 text-center">
          送信後、管理会社が確認・承認します。承認後に退去日が確定します。
        </p>
      </form>
    </div>
  );
}
