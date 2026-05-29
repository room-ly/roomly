"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getGaClientId } from "@/lib/ga-client-id";

type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  referrer?: string;
  landing_path?: string;
  ga_client_id?: string;
  affiliate_code?: string;
  visitor_id?: string;
  captured_at?: string;
};

const ATTRIBUTION_KEY = "roomly_attribution";
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// 初回着地時のUTM・referrerをlocalStorageに保持し、サインアップ時にAPIへ送る
function captureAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(ATTRIBUTION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Attribution;
      const ts = parsed.captured_at ? Date.parse(parsed.captured_at) : 0;
      if (ts && Date.now() - ts < ATTRIBUTION_TTL_MS) {
        return parsed;
      }
    }
  } catch {
    // パース失敗は無視
  }

  const params = new URLSearchParams(window.location.search);
  const pick = (k: string) => params.get(k) || undefined;
  // HP側で付与した rm_ref / rm_landing を優先（外部からの本来の流入元）
  const externalRef = pick("rm_ref");
  const externalLanding = pick("rm_landing");
  // HP側で付与した rm_aff / rm_vid （アフィリエイトコードとvisitor_id）
  const affiliateCode = pick("rm_aff");
  const visitorId = pick("rm_vid");
  const data: Attribution = {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_term: pick("utm_term"),
    utm_content: pick("utm_content"),
    gclid: pick("gclid"),
    referrer: externalRef || document.referrer || undefined,
    landing_path:
      externalLanding || window.location.pathname + window.location.search,
    affiliate_code:
      affiliateCode && /^[A-Z0-9]{4,16}$/.test(affiliateCode)
        ? affiliateCode
        : undefined,
    visitor_id: visitorId && visitorId.length >= 8 ? visitorId : undefined,
    captured_at: new Date().toISOString(),
  };

  const hasAny = Object.entries(data).some(
    ([k, v]) => k !== "captured_at" && k !== "landing_path" && v
  );
  if (!hasAny) return null;

  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(data));
  } catch {
    // 容量超過等は無視
  }
  return data;
}

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
  }
}

// signup完了時にGA4へカスタムイベント送信（Google広告のCVはGA4経由で連携）
function fireSignupConversion() {
  window.gtag?.("event", "signup_complete", {});
}

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
  const [attribution, setAttribution] = useState<Attribution | null>(null);

  useEffect(() => {
    setAttribution(captureAttribution());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 送信直前にGA4 client_idを取得（広告チャネル別CVRの名寄せ用）
      const gaClientId = await getGaClientId();
      const attributionPayload: Attribution = {
        ...(attribution ?? {}),
        ...(gaClientId ? { ga_client_id: gaClientId } : {}),
      };

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          name,
          email,
          password,
          attribution: attributionPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "アカウント作成に失敗しました");
        return;
      }

      // signup完了をGoogle広告コンバージョンとして送信
      fireSignupConversion();

      if (data.requiresEmailConfirmation) {
        setSuccess(true);
      } else {
        // クライアント側でもログインしてAuthProviderのセッションを確立
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
            <h1 className="text-xl font-semibold text-ink">Roomly</h1>
          </div>
          <div className="card p-8">
            <div className="w-12 h-12 rounded-full bg-accent-tint flex items-center justify-center mx-auto mb-4">
              <span className="text-accent-deep text-xl">&#10003;</span>
            </div>
            <h2 className="text-lg font-semibold text-ink mb-2">メールを確認してください</h2>
            <p className="text-[13px] text-ink-3 leading-relaxed">
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
      <div className="hidden lg:flex lg:w-1/2 bg-ink relative overflow-hidden">
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

      {/* 右: サインアップフォーム */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-xl font-semibold text-ink tracking-wide">Roomly</h1>
            <a
              href="https://hp.roomly.jp"
              className="inline-flex items-center gap-1 mt-3 text-[12px] text-ink-3 hover:text-accent transition-colors"
            >
              ← hp.roomly.jp に戻る
            </a>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-ink">アカウント作成</h2>
            <p className="text-[13px] text-ink-3 mt-1.5">10区画まで無料で利用できます</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
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
              <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
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
              {loading ? "作成中..." : "無料で始める"}
            </button>
          </form>

          <p className="text-center text-[13px] text-ink-3 mt-6">
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
