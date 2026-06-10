import type { Metadata } from "next";
import Link from "next/link";
import { TEMPLATE_TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "賃貸管理テンプレート集（Excel・Word 無料ダウンロード）",
  description:
    "家賃管理表・退去精算書・原状回復負担割合表・契約更新通知・オーナー送金明細書・督促状・物件一覧表・入居時チェックリスト・鍵預かり証など、賃貸管理の実務にそのまま使えるExcel/Wordテンプレートを無料公開。会員登録不要。",
  alternates: { canonical: "/templates" },
  openGraph: {
    title: "賃貸管理テンプレート集（Excel・Word 無料） | Roomly",
    description:
      "家賃管理表・退去精算書・契約更新通知・督促状など、賃貸管理の実務にそのまま使えるExcel/Wordテンプレートを無料公開。会員登録不要。",
    type: "website",
    url: "https://hp.roomly.jp/templates",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function TemplatesIndex() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "賃貸管理テンプレート集",
    itemListElement: TEMPLATE_TOOLS.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.title,
      url: `https://hp.roomly.jp/templates/${t.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <section className="px-7 pt-20 pb-12 text-center sm:pt-28">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Templates</span>
          <h1 className="mt-6 text-[clamp(32px,5vw,56px)] font-medium leading-tight tracking-tight text-rm-primary">
            賃貸管理テンプレート集
          </h1>
          <p className="mt-5 text-[16px] text-rm-text-secondary">
            実務にそのまま使えるExcel・Wordテンプレート。会員登録不要・無料です。
          </p>
        </div>
      </section>

      <section className="px-7 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-5 sm:grid-cols-2">
            {TEMPLATE_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                href={`/templates/${tool.slug}`}
                className="block rounded-2xl border border-rm-border bg-rm-surface p-6 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <span className="inline-flex items-center rounded-full bg-rm-accent-tint px-2.5 py-0.5 text-[11px] font-medium text-rm-accent-deep">
                  {tool.format}
                </span>
                <h2 className="mt-3 text-[16px] font-medium text-rm-primary">{tool.title}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-rm-text-secondary">
                  {tool.description}
                </p>
                <p className="mt-4 text-[12px] text-rm-accent-deep">ダウンロード →</p>
              </Link>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-rm-border bg-rm-surface p-6 text-center sm:p-8">
            <p className="text-[14px] text-rm-text-secondary">
              数字を入れて判断材料を得る計算ツールもあります。
            </p>
            <Link
              href="/tools"
              className="mt-3 inline-flex items-center text-[14px] font-medium text-rm-accent-deep transition-colors hover:text-rm-primary"
            >
              賃貸経営の計算ツール集を見る →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
