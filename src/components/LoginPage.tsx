"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.error) {
        setError("メールアドレスまたはパスワードが正しくありません");
      } else {
        router.push("/");
      }
    } catch {
      setError("ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

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
            物件管理を、
            <br />
            もっとスマートに。
          </h2>
          <p className="text-white/50 text-[13px] leading-relaxed max-w-sm">
            物件・入居者・契約・家賃・修繕・オーナー送金を一元管理。
            賃貸管理業務の効率化を実現します。
          </p>
          <div className="mt-12 flex gap-10">
            {[
              { label: "管理物件", value: "500+" },
              { label: "導入企業", value: "50+" },
              { label: "入居率改善", value: "15%" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-semibold text-accent-light">{stat.value}</p>
                <p className="text-[11px] text-white/30 mt-1 tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右: ログインフォーム */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-xl font-semibold text-text tracking-wide">Roomly</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-text">ログイン</h2>
            <p className="text-[13px] text-text-muted mt-1.5">アカウント情報を入力してください</p>
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

            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  required
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
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <a
              href="/reset-password"
              className="block text-[13px] text-text-muted hover:text-accent transition-colors"
            >
              パスワードをお忘れですか？
            </a>
            <p className="text-[13px] text-text-muted">
              アカウントをお持ちでない方は{" "}
              <a href="/signup" className="text-accent hover:underline">
                新規登録
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
