"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AffiliateLoginForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,16}$/.test(token)) {
      setError("コードの形式が正しくありません");
      return;
    }
    router.push(`/affiliate/dashboard?token=${token}`);
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-rm-border bg-rm-surface p-8 sm:p-10">
      <h1 className="text-[24px] font-medium text-rm-primary text-center">
        アフィリエイターログイン
      </h1>
      <p className="mt-3 text-center text-[13px] text-rm-text-secondary leading-relaxed">
        ご登録時に発行された紹介コード（8桁の英数字）を入力してください。
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            紹介コード
          </label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="例: ABCD2345"
            className="mt-1 w-full rounded-xl border border-rm-border bg-rm-bg px-4 py-3 text-[14px] font-mono tracking-widest uppercase transition-all focus:border-rm-accent-deep focus:outline-none focus:ring-2 focus:ring-rm-accent-soft"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-full bg-rm-accent-deep px-6 py-3 text-[14px] font-medium text-white transition-all hover:opacity-90"
        >
          ダッシュボードを開く
        </button>
      </form>

      <p className="mt-6 text-center text-[12px] text-rm-text-secondary">
        まだ登録していない方は{" "}
        <Link href="/affiliate" className="text-rm-accent-deep underline">
          こちらから登録
        </Link>{" "}
        できます。
      </p>
      <p className="mt-2 text-center text-[12px] text-rm-text-secondary">
        コードを紛失した方は{" "}
        <Link href="/contact" className="text-rm-accent-deep underline">
          お問い合わせ
        </Link>{" "}
        からご連絡ください。
      </p>
    </div>
  );
}
