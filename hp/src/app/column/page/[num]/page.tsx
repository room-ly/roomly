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
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    num: String(i + 2),
  }));
}

export default async function ColumnPage({ params }: Props) {
  const { num } = await params;
  const page = parseInt(num, 10);

  if (isNaN(page) || page < 1) notFound();
  if (page === 1) redirect("/column");

  const posts = getAllArticles();
  const totalPages = getPageCount(posts.length);

  if (page > totalPages) notFound();

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

      <ArticleList articles={posts} currentPage={page} />
    </>
  );
}
