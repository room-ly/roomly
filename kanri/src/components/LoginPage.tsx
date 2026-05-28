"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login, verifyMfa } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  const [email, setEmail] = useState(isDemo ? "demo@roomly.jp" : "");
  const [password, setPassword] = useState(isDemo ? "demo1234" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.error) {
        if (result.error.includes("上限に達しました")) {
          setError(result.error);
        } else {
          setError("メールアドレスまたはパスワードが正しくありません");
        }
      } else if (result.mfaRequired) {
        setMfaStep(true);
      } else {
        if (isDemo) {
          navigator.sendBeacon("/api/demo-click");
        }
        router.push("/");
      }
    } catch {
      setError("ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await verifyMfa(mfaCode);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    } catch {
      setError("認証に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* 左: ブランディング */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center text-[18px] font-semibold">R</span>
              <h1 className="text-2xl font-semibold tracking-wide">Roomly</h1>
            </div>
            <span className="text-[11px] text-white/40 tracking-wider uppercase mt-2 block">賃貸管理SaaS</span>
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
          <a
            href="https://hp.roomly.jp"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors"
          >
            hp.roomly.jp →
          </a>
        </div>
      </div>

      {/* 右: ログインフォーム */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-ink text-bg grid place-items-center text-[15px] font-semibold">R</span>
              <h1 className="text-xl font-semibold text-ink tracking-wide">Roomly</h1>
            </div>
            <a
              href="https://hp.roomly.jp"
              className="inline-flex items-center gap-1 mt-3 text-[12px] text-ink-3 hover:text-accent transition-colors"
            >
              ← hp.roomly.jp に戻る
            </a>
          </div>

          {mfaStep ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-lg font-semibold text-ink">二要素認証</h2>
                <p className="text-[13px] text-ink-3 mt-1.5">認証アプリに表示された6桁のコードを入力してください</p>
              </div>

              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
                    認証コード
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="input text-center text-lg tracking-[0.3em]"
                    autoFocus
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-danger-tint text-danger text-[13px]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="w-full py-2.5 bg-accent text-white rounded-full font-medium text-[13px] transition-colors hover:bg-accent-deep disabled:opacity-50"
                >
                  {loading ? "認証中..." : "認証する"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => { setMfaStep(false); setMfaCode(""); setError(""); }}
                  className="text-[13px] text-ink-3 hover:text-accent transition-colors"
                >
                  ログイン画面に戻る
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-lg font-semibold text-ink">ログイン</h2>
                <p className="text-[13px] text-ink-3 mt-1.5">アカウント情報を入力してください</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
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
                  <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-danger-tint text-danger text-[13px]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-accent text-white rounded-full font-medium text-[13px] transition-colors hover:bg-accent-deep disabled:opacity-50"
                >
                  {loading ? "ログイン中..." : "ログイン"}
                </button>
              </form>

              <div className="mt-4 text-center space-y-2">
                <a
                  href="/reset-password"
                  className="block text-[13px] text-ink-3 hover:text-accent transition-colors"
                >
                  パスワードをお忘れですか？
                </a>
                <p className="text-[13px] text-ink-3">
                  アカウントをお持ちでない方は{" "}
                  <a href="/signup" className="text-accent hover:underline">
                    新規登録
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
