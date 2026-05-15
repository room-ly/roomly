import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "料金プラン",
  description:
    "Roomlyの料金プラン。10区画まで完全無料。全機能が使えるシンプルな区画数ベースの料金体系。初期費用・クレジットカード不要。",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "料金プラン | Roomly",
    description: "Roomlyの料金プラン。10区画まで完全無料。全機能が使えるシンプルな区画数ベースの料金体系。初期費用・クレジットカード不要。",
    type: "website",
    url: "https://hp.roomly.jp/pricing",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

const CHECK_SVG = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-rm-accent-deep shrink-0">
    <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const tiers: [string, string, boolean][] = [
  ["〜10区画", "無料", true],
  ["〜50区画", "¥5,000（税込）/月", false],
  ["〜100区画", "¥10,000（税込）/月", false],
  ["〜300区画", "¥15,000（税込）/月", false],
  ["〜500区画", "¥20,000（税込）/月", false],
  ["〜1,000区画", "¥25,000（税込）/月", false],
  ["〜2,000区画", "¥30,000（税込）/月", false],
  ["2,001区画〜", "1,000区画ごとに+¥5,000（税込）/月", false],
];


export default function PricingPage() {
  return (
    <>
      {/* ヒーロー */}
      <section data-section="pricing" className="px-7 pt-20 pb-16 text-center sm:pt-28">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Pricing</span>
          <h1 className="mt-6 text-[clamp(32px,5vw,56px)] font-medium leading-tight tracking-tight text-rm-primary">
            区画数で決まる、<br />
            <em className="font-serif-display italic text-rm-accent-deep font-normal">シンプル料金</em>。
          </h1>
          <p className="mt-5 text-[16px] text-rm-text-secondary">
            区画数に応じた分かりやすい料金。全プランで全機能が使えます。
          </p>
        </div>
      </section>

      {/* 料金テーブル */}
      <section className="px-7 pb-24">
        <div className="mx-auto max-w-[900px] rounded-3xl border border-rm-border bg-rm-surface p-8 grid grid-cols-1 gap-10 sm:grid-cols-[1.1fr_1fr] sm:p-12 sm:gap-14">
          <div>
            <span className="eyebrow">All-in-one plan</span>
            <h2 className="mt-4 text-[36px] font-medium leading-tight tracking-tight sm:text-[42px]">
              すべての機能。<br />
              <em className="font-serif-display italic text-rm-accent-deep font-normal">一つの料金で。</em>
            </h2>
            <p className="mt-5 text-[15px] text-rm-text-secondary max-w-[30em]">
              機能制限なし。区画数に応じてフェアな価格で。いつでも解約できて違約金もありません。
            </p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {["初期費用なし", "全機能利用可能", "クレジットカード不要で開始", "メールサポート付き", "データ暗号化（SSL/TLS）", "自動バックアップ", "いつでも解約・違約金なし"].map((x) => (
                <li key={x} className="flex items-center gap-2.5 text-[14px] text-rm-text-secondary">{CHECK_SVG} {x}</li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <a href="https://roomly.jp/login?demo=1" className="inline-flex h-10 items-center rounded-full border border-rm-border-strong px-[18px] text-[14px] font-medium text-rm-primary transition-colors hover:bg-rm-surface-tint">
                デモを試す
              </a>
              <a href="https://roomly.jp/signup" className="inline-flex h-10 items-center gap-2 rounded-full bg-rm-primary px-[18px] text-[14px] font-medium text-rm-bg transition-colors hover:bg-rm-accent-deep hover:text-white">
                無料で始める
              </a>
            </div>
            <p className="mt-4 text-[12px] text-rm-text-muted">
              ※ 10区画を超えても自動課金されることはありません。有料プランへの移行はクレジットカード登録後、ご自身で切り替えるまで発生しません。
            </p>
          </div>
          <div className="rounded-xl border border-rm-border bg-rm-bg overflow-hidden">
            {tiers.map(([range, price, free]) => (
              <div key={range} className={`flex items-center justify-between px-[18px] py-3.5 text-[14px] border-b border-rm-border last:border-b-0 ${free ? "bg-rm-accent-tint" : ""}`}>
                <span>{range}</span>
                <span className={`font-mono text-[13px] font-medium ${free ? "text-rm-accent-deep font-semibold" : "text-rm-text"}`}>{price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-section="cta" className="px-7 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(24px,3vw,36px)] font-medium tracking-tight text-rm-primary">
            まずは無料で試してみませんか？
          </h2>
          <p className="mt-4 text-[15px] text-rm-text-secondary">
            10区画まで無料。クレジットカード不要で、すぐに始められます。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="https://roomly.jp/login?demo=1" className="inline-flex h-12 items-center rounded-full border border-rm-border-strong px-[22px] text-[15px] font-medium text-rm-primary transition-colors hover:bg-rm-surface">
              デモを試す
            </a>
            <a href="https://roomly.jp/signup" className="inline-flex h-12 items-center rounded-full bg-rm-primary px-[22px] text-[15px] font-medium text-rm-bg transition-colors hover:bg-rm-accent-deep hover:text-white">
              無料で始める
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
