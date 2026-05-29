"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        if (typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    });

    // 招待・リセットリンクのhashトークンを明示的に取り込む
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (!error) {
            setReady(true);
            window.history.replaceState(null, "", window.location.pathname);
          } else {
            setError("リンクが無効か期限切れです。再度招待を依頼してください。");
          }
        });
        return () => subscription.unsubscribe();
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

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

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError("パスワードの更新に失敗しました: " + error.message);
        return;
      }

      router.push("/");
    } catch {
      setError("エラーが発生しました");
    } finally {
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
          <p className="text-[13px] text-ink-3">セッションを確認中...</p>
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
            disabled={loading}
            className="w-full py-2.5 bg-accent text-white rounded font-medium text-[13px] transition-colors hover:bg-accent-deep disabled:opacity-50"
          >
            {loading ? "更新中..." : "パスワードを更新"}
          </button>
        </form>
      </div>
    </div>
  );
}
