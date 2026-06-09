import type { Metadata } from "next";
import Link from "next/link";
import RestorationCalculator from "./RestorationCalculator";

export const metadata: Metadata = {
  title: "原状回復 負担割合計算ツール",
  description:
    "国土交通省ガイドラインに基づき、退去時の原状回復費用を大家・入居者でどう分担するかを計算します。耐用年数と入居期間から負担割合を自動算出します。",
  alternates: { canonical: "/tools/restoration-burden" },
  openGraph: {
    title: "原状回復 負担割合計算ツール | Roomly",
    description:
      "国土交通省ガイドラインに基づき、退去時の原状回復費用を大家・入居者でどう分担するかを計算します。",
    type: "website",
    url: "https://hp.roomly.jp/tools/restoration-burden",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function RestorationToolPage() {
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "原状回復 負担割合計算ツール",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
    description:
      "国土交通省ガイドラインに基づき、退去時の原状回復費用を大家・入居者でどう分担するかを計算するツール。",
    url: "https://hp.roomly.jp/tools/restoration-burden",
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
        name: "原状回復 負担割合計算",
        item: "https://hp.roomly.jp/tools/restoration-burden",
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
            <span className="text-rm-text-secondary">原状回復 負担割合計算</span>
          </nav>

          <h1 className="text-[26px] font-medium leading-snug text-rm-primary sm:text-[30px]">
            原状回復 負担割合計算ツール
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-rm-text-secondary">
            国土交通省「原状回復をめぐるトラブルとガイドライン」に基づき、
            退去時の原状回復費用を大家・入居者でどう分担するかを計算します。
            敷金精算や退去立会いの判断材料としてお使いください。
          </p>

          <div className="mt-10">
            <RestorationCalculator />
          </div>

          <section className="mt-14">
            <h2 className="text-[18px] font-medium text-rm-primary">原状回復の基本ルール</h2>
            <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-rm-text-secondary">
              <p>
                原状回復は「入居時の状態に戻す」ではなく、
                「入居者の故意・過失で生じた損耗だけを補修する」のが正しい意味です。
                通常の使用で生じた損耗や経年変化は、大家負担となります。
              </p>
              <p>
                2020年4月施行の改正民法第621条で、賃借人の原状回復義務は
                「通常の使用および収益によって生じた賃借物の損耗ならびに賃借物の経年変化を除く」と明文化されました。
              </p>
              <p>
                さらに耐用年数を考慮した按分計算により、入居期間が長いほど入居者の負担割合は減少します。
                たとえば壁紙（耐用年数6年）を喫煙で汚した場合、入居3年目なら入居者負担は50%、6年を超えれば1円になります。
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[18px] font-medium text-rm-primary">関連する用語</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/glossary/restoration-obligation"
                className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
              >
                原状回復
              </Link>
              <Link
                href="/glossary/normal-wear-and-tear"
                className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
              >
                通常損耗
              </Link>
              <Link
                href="/glossary/special-wear-and-tear"
                className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
              >
                特別損耗
              </Link>
              <Link
                href="/glossary/depreciation-restoration"
                className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
              >
                減価償却（原状回復）
              </Link>
              <Link
                href="/glossary/duty-of-care"
                className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
              >
                善管注意義務
              </Link>
              <Link
                href="/glossary/security-deposit"
                className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
              >
                敷金
              </Link>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[18px] font-medium text-rm-primary">関連コラム</h2>
            <div className="mt-5 space-y-3">
              <Link
                href="/column/restoration-guideline-calculation"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  原状回復ガイドラインの計算方法 — 耐用年数と按分のリアル
                </p>
              </Link>
              <Link
                href="/column/restoration-word-creates-disputes"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  「原状回復」という言葉自体が揉め事を生む — 退去時の説明の作り方
                </p>
              </Link>
              <Link
                href="/column/security-deposit-dispute-starts-at-move-in"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  敷金トラブルの9割は「入居時」に原因がある
                </p>
              </Link>
            </div>
          </section>

          <div className="mt-14 rounded-2xl bg-rm-primary p-8 text-center sm:p-10">
            <h2 className="text-[18px] font-medium text-rm-bg">
              退去精算もRoomlyで一元管理
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] text-rm-bg/60">
              入居時の写真・チェックシートから退去精算まで物件単位で記録。10区画まで無料。
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
