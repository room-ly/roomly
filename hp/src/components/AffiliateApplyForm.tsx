"use client";

import { useState } from "react";

type ProspectType =
  | ""
  | "blogger"
  | "influencer"
  | "community"
  | "professional"
  | "other";

const PROSPECT_TYPE_LABEL: Record<Exclude<ProspectType, "">, string> = {
  blogger: "ブログ・メディア運営",
  influencer: "SNS・YouTube発信者",
  community: "大家会・コミュニティ運営",
  professional: "税理士・司法書士・FP等の士業",
  other: "その他",
};

export default function AffiliateApplyForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    prospect_type: "" as ProspectType,
    website_url: "",
    social_url: "",
    notes: "",
    agree: false,
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agree) {
      setErrorMessage("利用規約に同意してください");
      return;
    }
    setErrorMessage("");
    setStatus("sending");

    try {
      const res = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          prospect_type: form.prospect_type || null,
          website_url: form.website_url || null,
          social_url: form.social_url || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "申込に失敗しました");
      }
      const data = (await res.json()) as { code?: string };
      if (!data.code) {
        throw new Error("コードの発行に失敗しました");
      }
      setIssuedCode(data.code);
      setStatus("sent");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "申込に失敗しました");
      setStatus("error");
    }
  };

  if (status === "sent" && issuedCode) {
    const referralUrl = `https://hp.roomly.jp/?ref=${issuedCode}`;
    const dashboardUrl = `/affiliate/dashboard?token=${issuedCode}`;

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // ignore
      }
    };

    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rm-border bg-rm-surface p-8 sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rm-accent-tint">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-rm-accent-deep"
            >
              <path
                d="M4 12l5 5L20 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-[18px] font-medium text-rm-primary">
            登録が完了しました
          </h3>
          <p className="mt-2 text-[14px] text-rm-text-secondary leading-relaxed">
            あなた専用の紹介リンクを発行しました。今すぐ共有を開始できます。
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <div className="text-[12px] font-medium text-rm-text-secondary">
              あなたの紹介リンク
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-rm-border bg-rm-bg px-4 py-3">
              <code className="flex-1 text-[13px] text-rm-primary break-all">
                {referralUrl}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-full bg-rm-accent-deep px-4 py-1.5 text-[12px] font-medium text-white transition-all hover:opacity-90"
              >
                {copied ? "コピー済み" : "コピー"}
              </button>
            </div>
            <p className="mt-2 text-[12px] text-rm-text-secondary">
              紹介コード: <span className="font-mono text-rm-primary">{issuedCode}</span>
            </p>
          </div>

          <div className="rounded-xl border border-rm-border bg-rm-bg p-4 text-[13px] text-rm-text-secondary leading-relaxed">
            <p className="font-medium text-rm-primary">次にやること</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>このリンクをブログ・SNS・コミュニティで共有</li>
              <li>ダッシュボードでクリック数・成果を確認</li>
              <li>登録メールアドレスを大切に保管（ログインIDになります）</li>
            </ul>
          </div>

          <a
            href={dashboardUrl}
            className="block w-full rounded-full bg-rm-accent-deep px-6 py-3 text-center text-[14px] font-medium text-white transition-all hover:opacity-90"
          >
            ダッシュボードを開く
          </a>

          <p className="text-center text-[11px] text-rm-text-secondary">
            ダッシュボードURLには紹介コードが含まれます。ブックマークしてご利用ください。
          </p>
        </div>
      </div>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-rm-border bg-rm-bg px-4 py-3 text-[14px] transition-all focus:border-rm-accent-deep focus:outline-none focus:ring-2 focus:ring-rm-accent-soft";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl rounded-2xl border border-rm-border bg-rm-surface p-8 sm:p-10"
    >
      <div className="space-y-5">
        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
          <p className="mt-1 text-[12px] text-rm-text-secondary">
            このメールアドレスがログインIDになります。
          </p>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            電話番号
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            活動カテゴリ <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={form.prospect_type}
            onChange={(e) =>
              setForm({ ...form, prospect_type: e.target.value as ProspectType })
            }
            className={inputClass}
          >
            <option value="">選択してください</option>
            {Object.entries(PROSPECT_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            ウェブサイトURL
          </label>
          <input
            type="url"
            placeholder="https://"
            value={form.website_url}
            onChange={(e) => setForm({ ...form, website_url: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            SNS・YouTube等のURL
          </label>
          <input
            type="url"
            placeholder="https://"
            value={form.social_url}
            onChange={(e) => setForm({ ...form, social_url: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-rm-text">
            主な発信内容・想定する紹介方法など
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={4}
            className={inputClass}
          />
        </div>

        <label className="flex items-start gap-2 text-[13px] text-rm-text">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(e) => setForm({ ...form, agree: e.target.checked })}
            className="mt-0.5"
          />
          <span>
            <a href="/legal/affiliate-terms" className="text-rm-accent-deep underline">
              アフィリエイト利用規約
            </a>{" "}
            に同意します
          </span>
        </label>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-full bg-rm-accent-deep px-6 py-3 text-[14px] font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
        >
          {status === "sending" ? "発行中..." : "登録して紹介リンクを発行"}
        </button>
        <p className="text-center text-[12px] text-rm-text-secondary">
          審査なし。送信後すぐに紹介リンクが発行されます。
        </p>
      </div>
    </form>
  );
}
