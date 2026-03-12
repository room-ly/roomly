import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAllArticles } from "@/lib/media";
import ArticleList, { getPageCount } from "@/components/ArticleList";

interface Props {
  params: Promise<{ num: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { num } = await params;
  const page = parseInt(num, 10);
  return {
    title: `コラム（${page}ページ目）`,
    description:
      "賃貸管理の業務改善に役立つコラムをお届けします。物件管理・家賃管理・オーナー対応・修繕管理のノウハウを紹介。",
    robots: { index: false, follow: true },
  };
}

export function generateStaticParams() {
  const posts = getAllArticles();
  const totalPages = getPageCount(posts.length);
  // ページ2以降を生成（ページ1は /column）
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    num: String(i + 2),
  }));
}

export default async function ColumnPage({ params }: Props) {
  const { num } = await params;
  const page = parseInt(num, 10);

  if (isNaN(page) || page < 1) notFound();
  // ページ1は /column にリダイレクト
  if (page === 1) redirect("/column");

  const posts = getAllArticles();
  const totalPages = getPageCount(posts.length);

  if (page > totalPages) notFound();

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

      <ArticleList articles={posts} currentPage={page} />
    </>
  );
}
