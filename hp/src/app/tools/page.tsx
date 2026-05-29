import type { Metadata } from "next";
import Link from "next/link";

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

const TOOLS = [
  {
    slug: "management-fee",
    title: "管理委託費シミュレーター",
    description:
      "家賃と戸数から、管理会社への月額委託費の相場レンジを計算します。集金代行・フル委託の違いも比較できます。",
    available: true,
  },
  {
    slug: "restoration-burden",
    title: "原状回復 負担割合計算",
    description:
      "国土交通省ガイドラインに基づき、退去時の大家・入居者の負担割合を耐用年数と入居期間から算出します。",
    available: true,
  },
  {
    slug: "vacancy-loss",
    title: "空室損失シミュレーター",
    description:
      "空室期間と家賃から、機会損失と募集コストの合計額を可視化します。客付け価値を数字で証明できます。",
    available: true,
  },
  {
    slug: "self-vs-outsource",
    title: "委託vs自主管理 損益分岐",
    description:
      "物件数と時間コストから、自主管理と管理委託のどちらが得かを計算。何戸目から委託が合理的になるかが分かります。",
    available: true,
  },
];

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
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {TOOLS.map((tool) => (
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
      </section>
    </>
  );
}
