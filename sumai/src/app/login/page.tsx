"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    setLoading(false);

    if (error) {
      setError("ログインリンクの送信に失敗しました。メールアドレスを確認してください。");
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-xl bg-accent text-white grid place-items-center text-lg font-bold">R</span>
            <span className="text-xl font-bold text-ink">Roomly</span>
          </div>
          <p className="text-ink-3 text-sm">入居者マイページ</p>
        </div>

        {sent ? (
          <div className="card p-6 text-center">
            <CheckCircle size={40} className="text-success mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">メールを送信しました</h2>
            <p className="text-sm text-ink-3 mb-4">
              <strong>{email}</strong> にログインリンクを送信しました。
              メールを確認してリンクをクリックしてください。
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-accent hover:text-accent-deep transition-colors"
            >
              別のメールアドレスで試す
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6">
            <h2 className="text-lg font-semibold mb-1">ログイン</h2>
            <p className="text-sm text-ink-3 mb-6">
              登録済みのメールアドレスにログインリンクを送信します
            </p>

            <label className="block text-sm font-medium text-ink-2 mb-1.5">
              メールアドレス
            </label>
            <div className="relative mb-4">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-line rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-danger mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white py-2.5 rounded-xl text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "送信中..." : "ログインリンクを送信"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-ink-4 mt-6">
          管理会社から招待を受けた方がご利用いただけます
        </p>
      </div>
    </div>
  );
}
