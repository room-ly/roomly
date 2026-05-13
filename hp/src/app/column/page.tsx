import type { Metadata } from "next";
import { getAllArticles } from "@/lib/media";
import ArticleList from "@/components/ArticleList";

export const metadata: Metadata = {
  title: "コラム",
  description:
    "賃貸管理の業務改善に役立つコラムをお届けします。物件管理・家賃管理・オーナー対応・修繕管理のノウハウを紹介。",
  alternates: { canonical: "/column" },
  openGraph: {
    title: "コラム | Roomly",
    description:
      "賃貸管理の業務改善に役立つコラムをお届けします。物件管理・家賃管理・オーナー対応・修繕管理のノウハウを紹介。",
    type: "website",
    url: "https://hp.roomly.jp/column",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export const revalidate = 3600;

export default function BlogIndex() {
  const posts = getAllArticles();

  return (
    <>
      <section className="px-7 pt-20 pb-16 text-center sm:pt-28">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Column</span>
          <h1 className="mt-6 text-[clamp(32px,5vw,56px)] font-medium leading-tight tracking-tight text-rm-primary">
            コラム
          </h1>
          <p className="mt-5 text-[16px] text-rm-text-secondary">
            賃貸管理の業務改善に役立つ情報をお届けします
          </p>
        </div>
      </section>

      <ArticleList articles={posts} currentPage={1} />
    </>
  );
}
