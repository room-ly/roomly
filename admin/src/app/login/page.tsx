"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError("メールアドレスまたはパスワードが正しくありません");
        return;
      }
      // ログイン成功 → ルートへ
      router.push("/");
      router.refresh();
    } catch {
      setError("ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold">Roomly Admin</h1>
          <p className="text-[11px] text-ink-3 tracking-wider uppercase mt-1">
            運営者専用
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="card p-7 space-y-4 bg-surface border border-line rounded-xl"
        >
          <label className="block">
            <span className="text-xs font-medium text-ink-2">メール</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-line bg-bg text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-2">パスワード</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-line bg-bg text-sm"
            />
          </label>
          {error && (
            <div className="p-2 rounded bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-accent text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
          <p className="text-[11px] text-ink-3 leading-relaxed">
            kanri.roomly.jp と同じアカウントでログインできます。
            ROOMLY_ADMIN_EMAILSに登録されていないアドレスはログインできても403になります。
          </p>
        </form>
      </div>
    </div>
  );
}
