"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "アカウント作成に失敗しました");
        return;
      }

      // サインアップ成功 → メール確認待ち or 自動ログイン
      if (data.requiresEmailConfirmation) {
        setSuccess(true);
      } else {
        // 自動ログイン
        const supabase = createClient();
        await supabase.auth.signInWithPassword({ email, password });
        router.push("/");
      }
    } catch {
      setError("アカウント作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text">Roomly</h1>
          </div>
          <div className="card p-8">
            <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
              <span className="text-success text-xl">&#10003;</span>
            </div>
            <h2 className="text-lg font-semibold text-text mb-2">メールを確認してください</h2>
            <p className="text-[13px] text-text-muted leading-relaxed">
              {email} に確認メールを送信しました。
              メール内のリンクをクリックしてアカウントを有効化してください。
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
    <div className="min-h-screen bg-bg flex">
      {/* 左: ブランディング */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-10">
            <h1 className="text-2xl font-semibold tracking-wide">Roomly</h1>
            <span className="text-[11px] text-white/40 tracking-wider uppercase">賃貸管理SaaS</span>
          </div>
          <h2 className="text-xl font-medium leading-relaxed mb-4 text-white/90">
            無料で始められる
            <br />
            賃貸管理ソフト
          </h2>
          <p className="text-white/50 text-[13px] leading-relaxed max-w-sm">
            10区画まで無料。クレジットカード不要。
            今すぐアカウントを作成して始めましょう。
          </p>
        </div>
      </div>

      {/* 右: サインアップフォーム */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-xl font-semibold text-text tracking-wide">Roomly</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-text">アカウント作成</h2>
            <p className="text-[13px] text-text-muted mt-1.5">10区画まで無料で利用できます</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                会社名
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例: サンプル不動産管理"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                氏名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 山田太郎"
                className="input"
                required
              />
            </div>

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

            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                パスワード
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
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
              {loading ? "作成中..." : "無料で始める"}
            </button>
          </form>

          <p className="text-center text-[13px] text-text-muted mt-6">
            すでにアカウントをお持ちですか？{" "}
            <Link href="/login" className="text-accent hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
