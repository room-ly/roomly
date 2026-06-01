import type { Metadata } from "next";
import Link from "next/link";
import VacancyLossCalculator from "./VacancyLossCalculator";

export const metadata: Metadata = {
  title: "空室損失シミュレーター",
  description:
    "空室期間と家賃から、機会損失と広告料の合計損失を計算します。「1ヶ月空室で◯円損」を可視化し、客付け施策の投資判断に使えます。",
  alternates: { canonical: "/tools/vacancy-loss" },
  openGraph: {
    title: "空室損失シミュレーター | Roomly",
    description:
      "空室期間と家賃から、機会損失と広告料の合計損失を計算します。客付け施策の投資判断に使えます。",
    type: "website",
    url: "https://hp.roomly.jp/tools/vacancy-loss",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function VacancyLossToolPage() {
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "空室損失シミュレーター",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
    description: "空室期間と家賃から、機会損失と広告料の合計損失を計算するツール。",
    url: "https://hp.roomly.jp/tools/vacancy-loss",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: "https://hp.roomly.jp" },
      { "@type": "ListItem", position: 2, name: "計算ツール", item: "https://hp.roomly.jp/tools" },
      {
        "@type": "ListItem",
        position: 3,
        name: "空室損失シミュレーター",
        item: "https://hp.roomly.jp/tools/vacancy-loss",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="px-7 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <nav className="mb-8 text-[13px] text-rm-text-muted">
            <Link href="/" className="transition-colors hover:text-rm-accent-deep">トップ</Link>
            <span className="mx-2">/</span>
            <Link href="/tools" className="transition-colors hover:text-rm-accent-deep">計算ツール</Link>
            <span className="mx-2">/</span>
            <span className="text-rm-text-secondary">空室損失シミュレーター</span>
          </nav>

          <h1 className="text-[26px] font-medium leading-snug text-rm-primary sm:text-[30px]">
            空室損失シミュレーター
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-rm-text-secondary">
            空室期間中の機会損失と募集にかかる広告料の合計損失を計算します。
            家賃下げ・リフォーム・客付け業者へのインセンティブ強化など、空室対策の投資判断にお使いください。
          </p>

          <div className="mt-10">
            <VacancyLossCalculator />
          </div>

          <section className="mt-14">
            <h2 className="text-[18px] font-medium text-rm-primary">空室損失の見方</h2>
            <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-rm-text-secondary">
              <p>
                月額家賃7万円の物件が3ヶ月空くと、家賃の機会損失だけで21万円。
                さらに次の入居者を決めるための広告料(AD)1ヶ月分7万円を加えると、合計28万円の損失です。
              </p>
              <p>
                家賃を月3,000円下げると、年間で3万6千円の収入減になります。
                同じ条件で空室を3ヶ月分回避できるなら、家賃を下げて埋めた方が合理的、という判断につながります。
              </p>
              <p>
                「いくらまでなら家賃を下げてもいいか」「リフォーム費用◯万円は何ヶ月で回収できるか」を、
                損失額の数字に変えて判断材料にします。
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[18px] font-medium text-rm-primary">関連コラム</h2>
            <div className="mt-5 space-y-3">
              <Link
                href="/column/vacancy-measures-checklist"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  空室対策のチェックリスト — 「家賃を下げる前」にできること
                </p>
              </Link>
              <Link
                href="/column/full-occupancy-profitability-trap"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  満室経営の収益性の罠 — 稼働率と利益は一致しない
                </p>
              </Link>
              <Link
                href="/column/stay-reason-not-at-viewing"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  入居者が「住み続ける理由」は内見時には見えない
                </p>
              </Link>
            </div>
          </section>

          <div className="mt-14 rounded-2xl bg-rm-primary p-8 text-center sm:p-10">
            <h2 className="text-[18px] font-medium text-rm-bg">
              空室状況をRoomlyでリアルタイム可視化
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] text-rm-bg/60">
              空室期間・募集状況・問い合わせ件数を物件ごとに記録。10区画まで無料。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="https://kanri.roomly.jp/login?demo=1"
                className="inline-flex h-11 items-center rounded-full bg-rm-bg px-[20px] text-[14px] font-medium text-rm-primary transition-colors hover:bg-rm-accent-tint"
              >
                デモを試す
              </a>
              <a
                href="https://kanri.roomly.jp/signup"
                className="inline-flex h-11 items-center rounded-full border border-rm-bg/30 px-[20px] text-[14px] font-medium text-rm-bg transition-colors hover:bg-rm-bg/10"
              >
                無料で始める
              </a>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
