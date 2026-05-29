"use client";

import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // hash の access_token を読み取って保持（URLからは消す）
    if (window.location.hash.includes("access_token")) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const token = params.get("access_token");
      if (token) {
        window.history.replaceState(null, "", window.location.pathname);
        startTransition(() => {
          setAccessToken(token);
          setReady(true);
        });
        return;
      }
    }

    // hash が無ければ既存セッション（パスワードリセット中のログインユーザー等）を確認
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      startTransition(() => {
        if (session) {
          setAccessToken(session.access_token);
          setReady(true);
        } else {
          setError("リンクが無効か期限切れです。再度招待を依頼してください。");
          setReady(true);
        }
      });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }
    if (!accessToken) {
      setError("認証情報が見つかりません。招待リンクを再度クリックしてください。");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/set-initial-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "パスワードの更新に失敗しました");
        setLoading(false);
        return;
      }

      // 新しいパスワードでログインしてからトップへ
      // この時点でユーザーのメールは Supabase 側で取得済みではないため、
      // ログイン画面で再度入力してもらう
      router.push("/login?invited=1");
    } catch {
      setError("通信エラーが発生しました");
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-ink tracking-wide">Roomly</h1>
          </div>
          <div className="card p-8">
            <Loader2 className="w-6 h-6 text-accent mx-auto mb-3 animate-spin" />
            <p className="text-[13px] text-ink-3">招待リンクを確認中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-ink tracking-wide">Roomly</h1>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-ink">パスワード再設定</h2>
          <p className="text-[13px] text-ink-3 mt-1.5">
            新しいパスワードを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
              新しいパスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上"
                className="input pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
              パスワード確認
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力してください"
              className="input"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-danger-tint text-danger text-[13px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !accessToken}
            className="w-full py-2.5 bg-accent text-white rounded font-medium text-[13px] transition-colors hover:bg-accent-deep disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "更新中..." : "パスワードを更新"}
          </button>
        </form>
      </div>
    </div>
  );
}
