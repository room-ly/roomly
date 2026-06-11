"use client";

import { useState } from "react";

// 共有用リンク（決済者が自分で送る場合にコピーする）。?from=demo-share で紹介経由を記録。
const DEMO_LOGIN_URL = "https://kanri.roomly.jp/login?demo=1&from=demo-share";
const PRICING_URL = "https://hp.roomly.jp/pricing?from=demo-share";

const COPY_TEXT = `賃貸管理SaaS「Roomly」を試してみました。物件・入居者・契約・家賃・修繕・オーナー送金まで一元管理できます。

▼ デモを触ってみる（登録不要・無料）
${DEMO_LOGIN_URL}

▼ 料金・お申し込み
${PRICING_URL}`;

function gtagEvent(name: string) {
  (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.(
    "event",
    name,
    {}
  );
}

export default function DemoNotice() {
  const [leaving, setLeaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // デモ→無料登録への遷移。
  const handleSignup = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      gtagEvent("demo_to_signup_click");
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ログアウト失敗してもsignupへは進める
    }
    window.location.href = "/signup?from=demo";
  };

  // 共有モーダルを開く。開いたことをログに記録（GA4 + サーバー側）。
  const openShare = () => {
    gtagEvent("demo_share_open");
    fetch("/api/demo-share-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "open" }),
    }).catch(() => {});
    setShareOpen(true);
  };

  return (
    <>
      <div className="sticky top-0 z-40 bg-accent px-5 py-2.5 text-[12.5px] text-white leading-relaxed shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded-full bg-white/20 text-white shrink-0">
            DEMO
          </span>
          <p className="flex-1 min-w-0 text-white/90">
            ここはデモ環境です。物件・契約・入居者などを自由に作成・編集・削除して動作確認していただけます。
            <span className="font-semibold text-white">編集しても料金は一切かかりません。</span>
            データは定期的に初期状態にリセットされるため、操作内容は保存されません。
          </p>
          <button
            type="button"
            onClick={openShare}
            className="shrink-0 inline-flex items-center gap-1 rounded-md bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white ring-1 ring-white/30 transition-colors hover:bg-white/25"
          >
            決済者に共有
          </button>
          <button
            type="button"
            onClick={handleSignup}
            disabled={leaving}
            className="shrink-0 inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-[12px] font-semibold text-accent transition-colors hover:bg-white/90 disabled:opacity-60"
          >
            {leaving ? "移動中…" : "無料で始める →"}
          </button>
        </div>
      </div>

      {shareOpen && (
        <ShareModal onClose={() => setShareOpen(false)} />
      )}
    </>
  );
}

// 決済者への共有モーダル。①Roomlyから送る ②自分で送る（コピー）の2方式。
function ShareModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (sending) return;
    setError(null);
    const to = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setError("メールアドレスを正しく入力してください");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/demo-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, senderName: senderName.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "送信に失敗しました");
      }
      gtagEvent("demo_share_email_sent");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COPY_TEXT);
      setCopied(true);
      gtagEvent("demo_share_copied");
      fetch("/api/demo-share-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "copied" }),
      }).catch(() => {});
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("コピーに失敗しました。手動でコピーしてください");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-primary">
            決済者・上長に共有する
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <p className="mb-5 text-[12.5px] text-gray-500 leading-relaxed">
          導入を検討してもらいたい方に、Roomlyのデモと料金をまとめてお送りできます。
        </p>

        {sent ? (
          <div className="rounded-lg bg-success/10 p-4 text-[13px] text-success">
            送信しました。決済者の方にRoomlyのご案内メールが届きます。
            <div className="mt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-success px-4 py-1.5 text-[12px] font-semibold text-white"
              >
                閉じる
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ① Roomlyから送る */}
            <div className="mb-5">
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">
                送信先メールアドレス（決済者・上長）
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="boss@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-[13px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <label className="mb-1.5 mt-3 block text-[12px] font-semibold text-gray-700">
                お名前（任意・メールに表示されます）
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="例: 山田"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-[13px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {error && (
                <p className="mt-2 text-[12px] text-danger">{error}</p>
              )}
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="mt-3 w-full rounded-md bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary disabled:opacity-60"
              >
                {sending ? "送信中…" : "Roomlyから案内メールを送る"}
              </button>
              <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
                差出人は noreply@roomly.jp、ご返信は contact@roomly.jp に届きます。
              </p>
            </div>

            <div className="relative my-4 text-center">
              <span className="bg-white px-2 text-[11px] text-gray-400 relative z-10">
                または
              </span>
              <span className="absolute left-0 top-1/2 h-px w-full bg-gray-200" />
            </div>

            {/* ② 自分で送る（コピー） */}
            <button
              type="button"
              onClick={handleCopy}
              className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {copied ? "コピーしました ✓" : "メール文面をコピーして自分で送る"}
            </button>
            <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
              LINEやSlack、ご自身のメールで送りたい場合に。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
