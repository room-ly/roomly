import type { Metadata } from "next";
import Link from "next/link";
import { CALCULATOR_TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "賃貸経営の計算ツール集",
  description:
    "管理委託費・原状回復負担割合・空室損失・委託vs自主管理の損益分岐など、賃貸経営に役立つ計算ツールを無料公開。数字を入れるだけで判断材料が得られます。",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "賃貸経営の計算ツール集 | Roomly",
    description:
      "管理委託費・原状回復負担割合・空室損失・委託vs自主管理の損益分岐など、賃貸経営に役立つ計算ツールを無料公開。",
    type: "website",
    url: "https://hp.roomly.jp/tools",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function ToolsIndex() {
  return (
    <>
      <section className="px-7 pt-20 pb-12 text-center sm:pt-28">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Tools</span>
          <h1 className="mt-6 text-[clamp(32px,5vw,56px)] font-medium leading-tight tracking-tight text-rm-primary">
            計算ツール
          </h1>
          <p className="mt-5 text-[16px] text-rm-text-secondary">
            賃貸経営の判断に役立つ無料計算ツール
          </p>
        </div>
      </section>

      <section className="px-7 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-5 sm:grid-cols-2">
            {CALCULATOR_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="block rounded-2xl border border-rm-border bg-rm-surface p-6 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <h2 className="text-[16px] font-medium text-rm-primary">{tool.title}</h2>
                <p className="mt-3 text-[13px] leading-relaxed text-rm-text-secondary">
                  {tool.description}
                </p>
                <p className="mt-4 text-[12px] text-rm-accent-deep">使ってみる →</p>
              </Link>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-rm-border bg-rm-surface p-6 text-center sm:p-8">
            <p className="text-[14px] text-rm-text-secondary">
              印刷・記入してそのまま使えるテンプレートもあります。
            </p>
            <Link
              href="/templates"
              className="mt-3 inline-flex items-center text-[14px] font-medium text-rm-accent-deep transition-colors hover:text-rm-primary"
            >
              賃貸管理テンプレート集を見る →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
