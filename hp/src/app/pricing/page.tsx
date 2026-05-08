import type { Metadata } from "next";
import { CheckCircle2, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "料金プラン",
  description:
    "Roomlyの料金プラン。10区画まで完全無料。全機能が使えるシンプルな区画数ベースの料金体系。初期費用・クレジットカード不要。",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "料金プラン | Roomly",
    description:
      "Roomlyの料金プラン。10区画まで完全無料。全機能が使えるシンプルな区画数ベースの料金体系。初期費用・クレジットカード不要。",
    type: "website",
    url: "https://hp.roomly.jp/pricing",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

const tiers = [
  { range: "〜10区画", price: "無料", highlight: false },
  { range: "〜50区画", price: "¥5,000（税込）/月", highlight: true },
  { range: "〜100区画", price: "¥10,000（税込）/月", highlight: false },
  { range: "〜300区画", price: "¥15,000（税込）/月", highlight: false },
  { range: "〜500区画", price: "¥20,000（税込）/月", highlight: false },
  { range: "〜1,000区画", price: "¥25,000（税込）/月", highlight: false },
  { range: "〜2,000区画", price: "¥30,000（税込）/月", highlight: false },
  { range: "2,001区画〜", price: "1,000区画ごとに+¥5,000（税込）/月", highlight: false },
];

const faqs = [
  {
    q: "無料プランに期限はありますか？",
    a: "いいえ。10区画以内であれば、期限なくずっと無料でお使いいただけます。",
  },
  {
    q: "プラン変更はいつでもできますか？",
    a: "はい。区画数の増減に応じて、いつでもプランを変更できます。日割り計算で精算されます。",
  },
  {
    q: "2,000区画を超える場合はどうなりますか？",
    a: "2,001区画以降は1,000区画ごとに月額¥5,000（税込）が加算されます。例えば3,000区画の場合は月額¥35,000（税込）です。",
  },
  {
    q: "解約時の違約金はありますか？",
    a: "ありません。いつでも解約でき、違約金は一切発生しません。",
  },
  {
    q: "支払い方法は？",
    a: "クレジットカード（Visa / Mastercard / JCB）に対応予定です。無料プランではカード登録不要です。",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* ヒーロー */}
      <section className="bg-rm-hero px-4 py-20 text-center text-white sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            シンプルな料金体系
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-white/60 sm:text-base">
            区画数に応じた分かりやすい料金。全プランで全機能が使えます。
          </p>
        </div>
      </section>

      {/* 料金プラン */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-rm-border bg-rm-surface p-8 shadow-sm">
            <div className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-rm-accent">全プラン全機能利用可能</p>
              <p className="mt-3 text-[13px] text-rm-text-secondary">
                区画数に応じたシンプルな従量制。機能差はありません。
              </p>
            </div>
            <div className="mt-8 space-y-2">
              {tiers.map((tier) => (
                <div
                  key={tier.range}
                  className={`flex items-center justify-between rounded p-3 text-[13px] ${
                    tier.highlight
                      ? "bg-rm-accent/5 border border-rm-accent/20"
                      : "bg-rm-bg"
                  }`}
                >
                  <span className="text-rm-text-secondary">{tier.range}</span>
                  <span className={`font-semibold ${tier.price === "無料" ? "text-rm-accent" : "text-rm-text"}`}>
                    {tier.price}
                  </span>
                </div>
              ))}
            </div>
            <a
              href="https://roomly.jp"
              className="mt-8 block rounded bg-rm-accent py-3 text-center text-[13px] font-medium text-white transition-colors hover:bg-rm-accent-light"
            >
              無料で始める
            </a>
          </div>
        </div>
      </section>

      {/* 全プラン共通 */}
      <section className="bg-rm-surface px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-semibold text-rm-primary sm:text-2xl">
            全プラン共通
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              "初期費用なし",
              "全機能利用可能",
              "クレジットカード不要で開始",
              "メールサポート付き",
              "データ暗号化（SSL/TLS）",
              "自動バックアップ",
              "いつでも解約可能",
              "違約金なし",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded bg-white p-4 dark:bg-[var(--rm-bg)]">
                <CheckCircle2 size={16} className="shrink-0 text-rm-accent" />
                <span className="text-[14px] text-rm-text-secondary">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金FAQ */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-semibold text-rm-primary sm:text-2xl">
            よくある質問
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg border border-rm-border bg-rm-surface p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle size={16} className="mt-0.5 shrink-0 text-rm-accent" />
                  <div>
                    <p className="text-[14px] font-semibold text-rm-primary">{faq.q}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-rm-text-secondary">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-rm-surface px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-rm-primary sm:text-2xl">
            まずは無料で試してみませんか？
          </h2>
          <p className="mt-4 text-[14px] text-rm-text-secondary">
            10区画まで無料。クレジットカード不要で、すぐに始められます。
          </p>
          <a
            href="https://roomly.jp"
            className="mt-8 inline-block rounded bg-rm-accent px-10 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-rm-accent-light"
          >
            無料で始める
          </a>
        </div>
      </section>
    </>
  );
}
