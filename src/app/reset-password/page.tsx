"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        setError("パスワードリセットメールの送信に失敗しました");
        return;
      }

      setSent(true);
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text tracking-wide">Roomly</h1>
          </div>
          <div className="card p-8">
            <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
              <span className="text-success text-xl">&#10003;</span>
            </div>
            <h2 className="text-lg font-semibold text-text mb-2">メールを送信しました</h2>
            <p className="text-[13px] text-text-muted leading-relaxed">
              {email} にパスワードリセット用のリンクを送信しました。
              メール内のリンクからパスワードを再設定してください。
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 text-[13px] text-accent hover:underline"
            >
              ログイン画面に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-text tracking-wide">Roomly</h1>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-text">パスワードリセット</h2>
          <p className="text-[13px] text-text-muted mt-1.5">
            登録済みのメールアドレスを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-danger-bg text-danger text-[13px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent text-white rounded font-medium text-[13px] transition-colors hover:bg-accent-light disabled:opacity-50"
          >
            {loading ? "送信中..." : "リセットリンクを送信"}
          </button>
        </form>

        <p className="text-center text-[13px] text-text-muted mt-6">
          <Link href="/login" className="text-accent hover:underline">
            ログインに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
