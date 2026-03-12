import Link from "next/link";
import type { Article } from "@/lib/media";

const ARTICLES_PER_PAGE = 6;

interface Props {
  articles: Article[];
  currentPage: number;
}

export function getPageCount(totalArticles: number): number {
  return Math.ceil(totalArticles / ARTICLES_PER_PAGE);
}

export function getArticlesForPage(
  articles: Article[],
  page: number
): Article[] {
  const start = (page - 1) * ARTICLES_PER_PAGE;
  return articles.slice(start, start + ARTICLES_PER_PAGE);
}

export default function ArticleList({ articles, currentPage }: Props) {
  const totalPages = getPageCount(articles.length);
  const pageArticles = getArticlesForPage(articles, currentPage);

  return (
    <>
      {/* 記事一覧 */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4">
            {pageArticles.map((post) => (
              <Link
                key={post.slug}
                href={`/column/${post.slug}`}
                className="block rounded bg-rm-surface p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8"
              >
                <article>
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
                    {post.title}
                  </h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-rm-text-secondary">
                    {post.description}
                  </p>
                  <span className="mt-4 inline-block text-[13px] font-medium text-rm-accent">
                    続きを読む →
                  </span>
                </article>
              </Link>
            ))}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <nav
              aria-label="ページナビゲーション"
              className="mt-12 flex items-center justify-center gap-2"
            >
              {/* 前へ */}
              {currentPage > 1 ? (
                <Link
                  href={currentPage === 2 ? "/column" : `/column/page/${currentPage - 1}`}
                  className="rounded border border-rm-border px-3 py-2 text-[13px] text-rm-text-secondary transition-colors hover:bg-rm-surface"
                >
                  ← 前へ
                </Link>
              ) : (
                <span className="rounded border border-rm-border/50 px-3 py-2 text-[13px] text-rm-text-muted/40">
                  ← 前へ
                </span>
              )}

              {/* ページ番号 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Link
                    key={page}
                    href={page === 1 ? "/column" : `/column/page/${page}`}
                    className={`rounded px-3 py-2 text-[13px] font-medium transition-colors ${
                      page === currentPage
                        ? "bg-rm-accent text-white"
                        : "border border-rm-border text-rm-text-secondary hover:bg-rm-surface"
                    }`}
                  >
                    {page}
                  </Link>
                )
              )}

              {/* 次へ */}
              {currentPage < totalPages ? (
                <Link
                  href={`/column/page/${currentPage + 1}`}
                  className="rounded border border-rm-border px-3 py-2 text-[13px] text-rm-text-secondary transition-colors hover:bg-rm-surface"
                >
                  次へ →
                </Link>
              ) : (
                <span className="rounded border border-rm-border/50 px-3 py-2 text-[13px] text-rm-text-muted/40">
                  次へ →
                </span>
              )}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
