import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "運営者情報",
  description:
    "Roomly（ルームリー）の運営者情報。賃貸管理会社向けSaaS「Roomly」を開発・運営するチームの理念と事業概要を紹介します。",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "運営者情報 | Roomly",
    description:
      "賃貸管理会社向けSaaS「Roomly」を開発・運営するチームの理念と事業概要。",
    url: "https://hp.roomly.jp/about",
    type: "website",
  },
};

// Organization 構造化データ（SERPでの実在性・ナレッジパネル材料）
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Roomly",
  alternateName: "ルームリー",
  url: "https://roomly.jp",
  logo: "https://hp.roomly.jp/icon.svg",
  description:
    "賃貸管理会社向けSaaS「Roomly」を開発・運営。物件・入居者・契約・家賃・修繕・オーナー送金を一つの画面で一元管理する。",
  email: "support@roomly.jp",
  foundingDate: "2026",
  knowsAbout: [
    "賃貸管理",
    "不動産管理SaaS",
    "家賃管理",
    "オーナー送金",
    "原状回復",
    "空室対策",
  ],
  sameAs: ["https://hp.roomly.jp"],
};

const facts: [string, string][] = [
  ["サービス名", "Roomly（ルームリー）"],
  ["事業内容", "賃貸管理会社向けクラウド管理SaaSの開発・運営"],
  ["サービスURL", "https://roomly.jp"],
  ["提供開始", "2026年"],
  ["お問い合わせ", "お問い合わせフォームより受付"],
];

export default function AboutPage() {
  return (
    <section className="px-7 pt-20 pb-24 sm:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow">About</span>
        <h1 className="mt-6 text-[clamp(28px,4vw,42px)] font-medium leading-tight tracking-tight text-rm-primary">
          Roomlyについて
        </h1>
        <p className="mt-6 text-[16px] leading-relaxed text-rm-text-secondary">
          Roomly（ルームリー）は、賃貸管理会社のための業務管理SaaSです。物件・入居者・契約・家賃・修繕・オーナー送金まで、
          バラバラだった管理業務を一つの画面にまとめます。
        </p>

        <h2 className="mt-14 text-[22px] font-medium tracking-tight text-rm-primary">
          わたしたちが解こうとしていること
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-rm-text-secondary">
          賃貸管理の現場には、いまもアナログでヒリヒリした業務が山ほど残っています。深夜の水漏れ対応、家賃滞納の督促、
          退去立会いの原状回復トラブル、オーナーへの毎月の収支報告。Excelと紙とメールを行き来しながら、担当者の記憶と気合で
          回している現場は少なくありません。
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-rm-text-secondary">
          Roomlyは、こうした「まだソフトウェアが届いていない現場」に、必要十分な道具を届けることを目指しています。
          多機能で複雑なシステムではなく、現場の人がすぐ使える、シンプルで速いプロダクトを。
        </p>

        <h2 className="mt-14 text-[22px] font-medium tracking-tight text-rm-primary">
          つくり方の方針
        </h2>
        <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-rm-text-secondary">
          <li className="flex gap-3">
            <span className="mt-[2px] text-rm-accent">—</span>
            <span>
              <strong className="text-rm-text">少人数 × AI活用。</strong>{" "}
              開発・運用にAIをフル活用し、少人数でも速く・正確にプロダクトを磨き続けます。
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-[2px] text-rm-accent">—</span>
            <span>
              <strong className="text-rm-text">誇張しない。</strong>{" "}
              未実装の機能を「ある」とは言いません。いまあるものと、これから作るものを正直にお伝えします。
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-[2px] text-rm-accent">—</span>
            <span>
              <strong className="text-rm-text">現場起点。</strong>{" "}
              機能の数ではなく、現場の手間がどれだけ減るかを基準に意思決定します。
            </span>
          </li>
        </ul>

        <h2 className="mt-14 text-[22px] font-medium tracking-tight text-rm-primary">
          事業者情報
        </h2>
        <div className="mt-6 rounded-2xl border border-rm-border bg-rm-surface overflow-hidden">
          {facts.map(([label, value]) => (
            <div key={label} className="flex border-b border-rm-border last:border-b-0">
              <div className="w-[140px] shrink-0 bg-rm-surface-tint px-5 py-4 text-[13px] font-medium text-rm-text sm:w-[180px]">
                {label}
              </div>
              <div className="px-5 py-4 text-[14px] text-rm-text-secondary">{value}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-rm-text-muted">
          特定商取引法に基づく事業者名・所在地・代表者等の表記は{" "}
          <Link href="/legal" className="text-rm-accent underline underline-offset-2">
            特定商取引法に基づく表記
          </Link>{" "}
          をご覧ください。
        </p>

        <div className="mt-14 rounded-2xl border border-rm-border bg-rm-surface-tint px-7 py-8">
          <p className="text-[15px] leading-relaxed text-rm-text-secondary">
            Roomlyについてのご質問・導入のご相談は、お気軽にどうぞ。
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-flex items-center rounded-full bg-rm-accent px-6 py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
          >
            お問い合わせ
          </Link>
        </div>
      </div>
    </section>
  );
}
