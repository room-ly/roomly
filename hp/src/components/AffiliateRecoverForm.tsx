"use client";

import { useState } from "react";
import Link from "next/link";

export default function AffiliateRecoverForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setStatus("sending");
    try {
      const res = await fetch("/api/affiliate/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "送信に失敗しました");
      }
      setStatus("sent");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "送信に失敗しました");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-rm-border bg-rm-surface p-8 sm:p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rm-accent-tint">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-rm-accent-deep"
          >
            <path
              d="M4 12l5 5L20 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-[20px] font-medium text-rm-primary">
          送信しました
        </h1>
        <p className="mt-3 text-[14px] text-rm-text-secondary leading-relaxed">
          入力いただいたメールアドレスがアフィリエイトに登録されていれば、
          ダッシュボードURLをお送りしました。数分以内にメールが届かない場合は、
          迷惑メールフォルダもご確認ください。
        </p>
        <p className="mt-6 text-[12px] text-rm-text-secondary">
          <Link href="/affiliate/login" className="text-rm-accent-deep underline">
            ログインに戻る
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-rm-border bg-rm-surface p-8 sm:p-10">
      <h1 className="text-[24px] font-medium text-rm-primary text-center">
        ダッシュボードURLを再送
      </h1>
      <p className="mt-3 text-center text-[13px] text-rm-text-secondary leading-relaxed">
        ご登録時のメールアドレスを入力してください。
        <br />
        該当する場合、ダッシュボードURLをメールでお送りします。
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            メールアドレス
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-xl border border-rm-border bg-rm-bg px-4 py-3 text-[14px] transition-all focus:border-rm-accent-deep focus:outline-none focus:ring-2 focus:ring-rm-accent-soft"
          />
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-full bg-rm-accent-deep px-6 py-3 text-[14px] font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
        >
          {status === "sending" ? "送信中..." : "ダッシュボードURLを送信"}
        </button>
      </form>

      <p className="mt-6 text-center text-[12px] text-rm-text-secondary">
        <Link href="/affiliate/login" className="text-rm-accent-deep underline">
          ログインに戻る
        </Link>
      </p>
    </div>
  );
}
