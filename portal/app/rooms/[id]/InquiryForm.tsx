"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

export default function InquiryForm({
  vacancyId,
  propertyName,
}: {
  vacancyId: string;
  propertyName: string;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vacancyId,
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        message: form.get("message"),
      }),
    });

    setSending(false);
    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "送信に失敗しました。時間をおいて再度お試しください。");
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
        <h3 className="text-lg font-bold mb-2">お問い合わせを送信しました</h3>
        <p className="text-sm text-gray-600">
          管理会社より折り返しご連絡いたします。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-bold text-lg mb-1">この物件について問い合わせる</h2>
      <p className="text-sm text-gray-500 mb-4">{propertyName}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            電話番号
          </label>
          <input
            name="phone"
            type="tel"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            お問い合わせ内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="message"
            required
            rows={4}
            placeholder="内見希望日時、入居希望時期、ご質問など"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-y"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 bg-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-accent/90 transition disabled:opacity-50"
        >
          <Send size={18} />
          {sending ? "送信中..." : "問い合わせを送信"}
        </button>
      </form>
    </div>
  );
}
