import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "コラム",
  description:
    "賃貸管理の業務改善に役立つコラムをお届けします。物件管理・家賃管理・オーナー対応・修繕管理のノウハウを紹介。",
};

export default function BlogIndex() {
  const posts = getAllPosts();

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

      {/* 記事一覧 */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="rounded bg-rm-surface p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8"
              >
                <div className="flex flex-wrap items-center gap-3 text-[12px] text-rm-text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rm-accent" />
                    {post.category}
                  </span>
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <h2 className="mt-3 text-[15px] font-semibold text-rm-primary sm:text-base">
                  <Link
                    href={`/column/${post.slug}`}
                    className="transition-colors hover:text-rm-accent"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-rm-text-secondary">
                  {post.description}
                </p>
                <Link
                  href={`/column/${post.slug}`}
                  className="mt-4 inline-block text-[13px] font-medium text-rm-accent transition-colors hover:text-rm-primary"
                >
                  続きを読む →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
