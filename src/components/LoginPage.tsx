"use client";

import { useState } from "react";
import { Building, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
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
      const success = await login(email, password);
      if (!success) {
        setError("メールアドレスまたはパスワードが正しくありません");
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
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full bg-purple-500 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 gradient-accent rounded-xl flex items-center justify-center">
              <Building size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Roomly</h1>
              <span className="text-xs text-white/50">賃貸管理SaaS</span>
            </div>
          </div>
          <h2 className="text-2xl font-semibold leading-relaxed mb-4">
            物件管理を、
            <br />
            もっとスマートに。
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-md">
            物件・入居者・契約・家賃・修繕・オーナー送金を一元管理。
            賃貸管理業務の効率化を実現します。
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: "管理物件", value: "500+" },
              { label: "導入企業", value: "50+" },
              { label: "入居率改善", value: "15%" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-accent-light">{stat.value}</p>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右: ログインフォーム */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* モバイルロゴ */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 gradient-accent rounded-xl flex items-center justify-center">
              <Building size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-text">Roomly</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-text">ログイン</h2>
            <p className="text-sm text-text-muted mt-2">アカウント情報を入力してください</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
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
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-danger-bg text-danger text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 gradient-accent text-white rounded-lg font-medium text-sm transition-all hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-text-muted">
            デモ用: 任意のメール・パスワードでログインできます
          </p>
        </div>
      </div>
    </div>
  );
}
