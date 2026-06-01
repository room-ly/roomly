import type { Metadata } from "next";
import Link from "next/link";
import ManagementFeeCalculator from "./ManagementFeeCalculator";

export const metadata: Metadata = {
  title: "管理委託費シミュレーター",
  description:
    "賃貸物件の管理委託費（管理手数料）を、家賃と戸数から無料で計算。集金代行・標準委託・フルサービスの3形態で月額・年額の相場レンジを表示します。",
  alternates: { canonical: "/tools/management-fee" },
  openGraph: {
    title: "管理委託費シミュレーター | Roomly",
    description:
      "賃貸物件の管理委託費を、家賃と戸数から無料で計算。集金代行・標準委託・フルサービスの3形態で相場を表示します。",
    type: "website",
    url: "https://hp.roomly.jp/tools/management-fee",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function ManagementFeeToolPage() {
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "管理委託費シミュレーター",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
    description:
      "賃貸物件の管理委託費を、家賃と戸数から計算するツール。集金代行・標準委託・フルサービスの3形態で相場レンジを表示します。",
    url: "https://hp.roomly.jp/tools/management-fee",
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
        name: "管理委託費シミュレーター",
        item: "https://hp.roomly.jp/tools/management-fee",
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
            <span className="text-rm-text-secondary">管理委託費シミュレーター</span>
          </nav>

          <h1 className="text-[26px] font-medium leading-snug text-rm-primary sm:text-[30px]">
            管理委託費シミュレーター
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-rm-text-secondary">
            想定家賃・戸数・管理形態から、賃貸物件の月額委託費の相場レンジを計算します。
            複数の管理会社から見積もりを取る前の判断材料としてお使いください。
          </p>

          <div className="mt-10">
            <ManagementFeeCalculator />
          </div>

          <section className="mt-14">
            <h2 className="text-[18px] font-medium text-rm-primary">管理委託費の基礎知識</h2>
            <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-rm-text-secondary">
              <p>
                管理委託費（管理手数料）は、賃貸物件のオーナーが管理会社に物件管理を委託する際に支払う費用です。
                家賃収入の<strong className="text-rm-primary">3〜5%</strong>が一般的な相場で、業務範囲によって料率が変わります。
              </p>
              <p>
                委託料以外にも、入居者募集時の広告料（AD）、契約更新事務手数料、退去立会い手数料、修繕工事の手配料が別途発生します。
                「委託料5%」だけ見て契約すると、年間の実質コストが想定より高くなりがちです。
              </p>
              <p>
                サブリース（家賃保証型）は手数料率が10〜20%と高めですが、空室リスクを管理会社が負う代わりに保証賃料は満室家賃の80〜90%に設定されます。
                家賃収入の安定性と引き換えに収益率が下がる仕組みです。
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[18px] font-medium text-rm-primary">関連する用語</h2>
            <div className="mt-4 flex flex-wrap gap-2">
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
              <Link
                href="/glossary/self-management"
                className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
              >
                自主管理
              </Link>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[18px] font-medium text-rm-primary">関連コラム</h2>
            <div className="mt-5 space-y-3">
              <Link
                href="/column/management-fee-5percent-worth-it"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  管理委託費5%は妥当か — 自主管理と比べて何が変わるか
                </p>
              </Link>
              <Link
                href="/column/management-fee-market-rate"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  賃貸管理の委託費相場 — エリア・規模・サービス内容で変わる料率
                </p>
              </Link>
              <Link
                href="/column/management-fee-iceberg"
                className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <p className="text-[14px] font-medium text-rm-primary">
                  管理委託費の氷山 — 表に出ない手数料の実態
                </p>
              </Link>
            </div>
          </section>

          <div className="mt-14 rounded-2xl bg-rm-primary p-8 text-center sm:p-10">
            <h2 className="text-[18px] font-medium text-rm-bg">
              Roomlyで月次収支を一画面で可視化
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] text-rm-bg/60">
              管理委託費・修繕費・送金額をまとめて見える化。10区画まで無料。
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
