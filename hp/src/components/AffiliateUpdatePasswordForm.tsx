"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AffiliateUpdatePasswordForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "submitting" | "done">(
    "idle"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    // Supabaseのrecoveryリンクで来ると、自動でsessionが張られる(detectSessionInUrl)。
    // 念のため状態を取得。
    supabase.auth.getUser().then(() => {
      // Supabaseのrecoveryリンクで自動的にセッションが張られる(detectSessionInUrl)。
      // 状態に関わらずフォームを出す。
      setStatus("ready");
    });
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("パスワードは8文字以上で設定してください");
      return;
    }
    if (password !== password2) {
      setError("パスワードが一致しません");
      return;
    }
    setStatus("submitting");
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setError(
        updateErr.message ||
          "パスワード更新に失敗しました。リンクの有効期限が切れている可能性があります。"
      );
      setStatus("ready");
      return;
    }
    setStatus("done");
    setTimeout(() => {
      router.push("/affiliate/dashboard");
      router.refresh();
    }, 1500);
  };

  if (status === "done") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-rm-border bg-rm-surface p-8 sm:p-10 text-center">
        <h1 className="text-[20px] font-medium text-rm-primary">
          パスワードを更新しました
        </h1>
        <p className="mt-3 text-[13px] text-rm-text-secondary">
          ダッシュボードへ移動します...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-rm-border bg-rm-surface p-8 sm:p-10">
      <h1 className="text-[24px] font-medium text-rm-primary text-center">
        パスワードの再設定
      </h1>
      <p className="mt-3 text-center text-[13px] text-rm-text-secondary leading-relaxed">
        新しいパスワードを設定してください。
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            新しいパスワード
          </label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8文字以上"
            className="mt-1 w-full rounded-xl border border-rm-border bg-rm-bg px-4 py-3 text-[14px] transition-all focus:border-rm-accent-deep focus:outline-none focus:ring-2 focus:ring-rm-accent-soft"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            新しいパスワード（確認）
          </label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="mt-1 w-full rounded-xl border border-rm-border bg-rm-bg px-4 py-3 text-[14px] transition-all focus:border-rm-accent-deep focus:outline-none focus:ring-2 focus:ring-rm-accent-soft"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-full bg-rm-accent-deep px-6 py-3 text-[14px] font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
        >
          {status === "submitting" ? "更新中..." : "パスワードを更新"}
        </button>

        <p className="text-center text-[12px] text-rm-text-secondary">
          <Link
            href="/affiliate?tab=login"
            className="text-rm-accent-deep underline"
          >
            ログインに戻る
          </Link>
        </p>
      </form>
    </div>
  );
}
