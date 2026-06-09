import type { Metadata } from "next";
import Link from "next/link";
import SelfVsOutsourceCalculator from "./SelfVsOutsourceCalculator";

export const metadata: Metadata = {
  title: "委託vs自主管理 損益分岐シミュレーター",
  description:
    "物件数と自主管理にかける時間から、管理委託と自主管理のどちらが得かを計算します。何戸目から委託が合理的になるかの判断材料を提供します。",
  alternates: { canonical: "/tools/self-vs-outsource" },
  openGraph: {
    title: "委託vs自主管理 損益分岐シミュレーター | Roomly",
    description:
      "物件数と自主管理にかける時間から、管理委託と自主管理のどちらが得かを計算します。",
    type: "website",
    url: "https://hp.roomly.jp/tools/self-vs-outsource",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function SelfVsOutsourceToolPage() {
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "委託vs自主管理 損益分岐シミュレーター",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
    description:
      "物件数と自主管理にかける時間から、管理委託と自主管理のどちらが得かを計算するツール。",
    url: "https://hp.roomly.jp/tools/self-vs-outsource",
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
        name: "委託vs自主管理 損益分岐",
        item: "https://hp.roomly.jp/tools/self-vs-outsource",
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
            <span className="text-rm-text-secondary">委託vs自主管理 損益分岐</span>
          </nav>

          <h1 className="text-[26px] font-medium leading-snug text-rm-primary sm:text-[30px]">
            委託vs自主管理 損益分岐シミュレーター
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-rm-text-secondary">
            物件数・家賃・自主管理にかける時間・あなたの時間単価から、
            管理委託と自主管理のどちらが経済合理性に優れるかを計算します。
            「何戸目から委託すべきか」の判断材料にお使いください。
          </p>

          <div className="mt-10">
            <SelfVsOutsourceCalculator />
          </div>

          <section className="mt-14">
            <h2 className="text-[18px] font-medium text-rm-primary">自主管理の本当のコスト</h2>
            <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-rm-text-secondary">
              <p>
                自主管理は「委託料を払わなくていい」と思いがちですが、
                自分の時間を時給換算してみると、思ったよりコストが高いケースが多くあります。
              </p>
              <p>
                10戸の物件で1戸あたり月2時間（家賃集金確認・問い合わせ対応・修繕手配）かかるとすると、月20時間。
                時給3,000円換算で月6万円分。これは委託料5%（家賃7万円×10戸×5%＝3.5万円）を大きく上回ります。
              </p>
              <p>
                さらに自主管理には「夜間の電話対応」「修繕の立会い」など金額に現れないストレスもあります。
                数字だけで判断せず、自分の生活の質も含めて検討する価値があります。
              </p>
              <p>
                自主管理を続けるか委託するかは、物件数だけでなく自分の本業との両立度で判断する必要があります。
                数字上は自主管理が得でも、本業が忙しい時期に夜間トラブルが重なれば、目に見えない疲弊が積み上がっていきます。
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[18px] font-medium text-rm-primary">関連する用語</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/glossary/self-management"
                className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
              >
                自主管理
              </Link>
              <Link
                href="/glossary/property-management"
                className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
              >
                管理委託
              </Link>
              <Link
                href="/glossary/rent-collection-agency"
                className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
              >
                集金代行
              </Link>
              <Link
                href="/glossary/subleasing"
                className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
              >
                サブリース
              </Link>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[18px] font-medium text-rm-primary">関連コラム</h2>
            <div className="mt-5 space-y-3">
              <Link
                href="/column/ruin-self-management-survivor-bias"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  「自主管理で成功した」のサバイバーバイアス
                </p>
              </Link>
              <Link
                href="/column/private-phone-landlord-stress"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  プライベートの電話が鳴り続ける — 自主管理大家のストレス
                </p>
              </Link>
              <Link
                href="/column/management-fee-5percent-worth-it"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  管理委託費5%は妥当か — 自主管理と比べて何が変わるか
                </p>
              </Link>
            </div>
          </section>

          <div className="mt-14 rounded-2xl bg-rm-primary p-8 text-center sm:p-10">
            <h2 className="text-[18px] font-medium text-rm-bg">
              自主管理の時間を取り戻す
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] text-rm-bg/60">
              Roomlyなら家賃集金・修繕受付・送金管理を一画面で。10区画まで無料。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="https://kanri.roomly.jp/login?demo=1"
                className="inline-flex h-11 items-center rounded-full bg-rm-bg px-[20px] text-[14px] font-medium text-rm-primary transition-colors hover:bg-rm-accent-tint"
              >
                会員登録不要でデモを試す
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
