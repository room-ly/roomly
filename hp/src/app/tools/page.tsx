import type { Metadata } from "next";
import Link from "next/link";
import { CALCULATOR_TOOLS, TEMPLATE_TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "賃貸経営の計算ツール・テンプレート集",
  description:
    "管理委託費・原状回復負担割合・空室損失などの計算ツールと、家賃管理表・退去精算書・契約更新通知などのExcel/Wordテンプレートを無料公開。賃貸管理の実務にそのまま使えます。",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "賃貸経営の計算ツール・テンプレート集 | Roomly",
    description:
      "管理委託費・原状回復負担割合・空室損失の計算ツールと、家賃管理表・退去精算書・契約更新通知などのExcel/Wordテンプレートを無料公開。",
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
            ツール・テンプレート
          </h1>
          <p className="mt-5 text-[16px] text-rm-text-secondary">
            賃貸経営の判断と実務に役立つ無料ツール・テンプレート
          </p>
        </div>
      </section>

      <section className="px-7 pb-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-[20px] font-medium text-rm-primary">ダウンロードできるテンプレート</h2>
          <p className="mt-2 text-[14px] text-rm-text-secondary">
            ExcelやWordで開いてそのまま使える雛形。会員登録不要・無料です。
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {TEMPLATE_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="block rounded-2xl border border-rm-border bg-rm-surface p-6 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-rm-accent-tint px-2.5 py-0.5 text-[11px] font-medium text-rm-accent-deep">
                    {tool.format}
                  </span>
                </div>
                <h3 className="mt-3 text-[16px] font-medium text-rm-primary">{tool.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-rm-text-secondary">
                  {tool.description}
                </p>
                <p className="mt-4 text-[12px] text-rm-accent-deep">ダウンロード →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-7 pb-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-[20px] font-medium text-rm-primary">計算ツール</h2>
          <p className="mt-2 text-[14px] text-rm-text-secondary">
            数字を入れるだけで判断材料が得られる無料シミュレーター。
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {CALCULATOR_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="block rounded-2xl border border-rm-border bg-rm-surface p-6 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <h3 className="text-[16px] font-medium text-rm-primary">{tool.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-rm-text-secondary">
                  {tool.description}
                </p>
                <p className="mt-4 text-[12px] text-rm-accent-deep">使ってみる →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
