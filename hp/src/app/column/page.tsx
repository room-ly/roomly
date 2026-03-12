import type { Metadata } from "next";
import { getAllArticles } from "@/lib/media";
import ArticleList from "@/components/ArticleList";

export const metadata: Metadata = {
  title: "コラム",
  description:
    "賃貸管理の業務改善に役立つコラムをお届けします。物件管理・家賃管理・オーナー対応・修繕管理のノウハウを紹介。",
};

export default function BlogIndex() {
  const posts = getAllArticles();

  return (
    <>
      {/* ページヘッダー */}
      <section className="bg-rm-hero px-4 py-16 text-center text-white sm:py-20">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          コラム
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[14px] text-white/50">
          賃貸管理の業務改善に役立つ情報をお届けします
        </p>
      </section>

      <ArticleList articles={posts} currentPage={1} />
    </>
  );
}
