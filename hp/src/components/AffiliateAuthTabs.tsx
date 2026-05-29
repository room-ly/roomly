"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tab = "signup" | "login";

function captureTracking() {
  try {
    const params = new URLSearchParams(window.location.search);
    let gaClientId: string | null = null;
    try {
      const m = document.cookie.match(/(?:^|; )_ga=GA[0-9].[0-9].([^;]+)/);
      if (m) gaClientId = m[1];
    } catch {
      // ignore
    }
    return {
      referrer: document.referrer || null,
      landing_path: window.location.pathname + window.location.search,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_term: params.get("utm_term"),
      utm_content: params.get("utm_content"),
      gclid: params.get("gclid"),
      ga_client_id: gaClientId,
    };
  } catch {
    return {};
  }
}

function fireGtag(eventName: string, params: Record<string, unknown>) {
  try {
    (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.(
      "event",
      eventName,
      params
    );
  } catch {
    // ignore
  }
}

export default function AffiliateAuthTabs({
  initialTab,
}: {
  initialTab: Tab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
  }, [tab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("submitting");
    const tracking = captureTracking();
    const action = tab === "signup" ? "signup" : "login";

    fireGtag(`affiliate_${action}_attempt`, { method: "password" });

    try {
      const res = await fetch(`/api/affiliate/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ...tracking }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // 既存メールでsignup → login タブに自動切替
        if (action === "signup" && data.existing) {
          setTab("login");
          setError(
            "このメールアドレスは既に登録されています。ログインしてください。"
          );
          setStatus("idle");
          return;
        }
        throw new Error(data.error || "処理に失敗しました");
      }
      fireGtag(`affiliate_${action}_success`, { method: "password" });
      router.push("/affiliate/dashboard");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "処理に失敗しました";
      fireGtag(`affiliate_${action}_failure`, { reason: msg });
      setError(msg);
      setStatus("idle");
    }
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-rm-border bg-rm-bg px-4 py-3 text-[14px] transition-all focus:border-rm-accent-deep focus:outline-none focus:ring-2 focus:ring-rm-accent-soft";

  return (
    <div className="rounded-2xl border border-rm-border bg-rm-surface p-6 sm:p-8">
      <div className="grid grid-cols-2 gap-2 rounded-full bg-rm-bg p-1">
        <button
          type="button"
          onClick={() => setTab("signup")}
          className={`rounded-full py-2 text-[13px] font-medium transition-all ${
            tab === "signup"
              ? "bg-rm-accent-deep text-white"
              : "text-rm-text-secondary"
          }`}
        >
          新規登録
        </button>
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`rounded-full py-2 text-[13px] font-medium transition-all ${
            tab === "login"
              ? "bg-rm-accent-deep text-white"
              : "text-rm-text-secondary"
          }`}
        >
          ログイン
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            メールアドレス
          </label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            パスワード
          </label>
          <input
            type="password"
            autoComplete={tab === "signup" ? "new-password" : "current-password"}
            required
            minLength={tab === "signup" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tab === "signup" ? "8文字以上" : ""}
            className={inputClass}
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
          {status === "submitting"
            ? tab === "signup"
              ? "登録中..."
              : "ログイン中..."
            : tab === "signup"
            ? "登録してダッシュボードを開く"
            : "ログイン"}
        </button>

        {tab === "signup" && (
          <p className="text-center text-[11px] text-rm-text-secondary">
            登録すると{" "}
            <Link
              href="/legal/affiliate-terms"
              className="text-rm-accent-deep underline"
            >
              アフィリエイト利用規約
            </Link>{" "}
            に同意したものとみなします。
          </p>
        )}

        {tab === "login" && (
          <p className="text-center text-[12px] text-rm-text-secondary">
            <Link
              href="/affiliate/recover"
              className="text-rm-accent-deep underline"
            >
              パスワードを忘れた方
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
