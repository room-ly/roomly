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
      <section className="px-7 pb-24">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageArticles.map((post) => (
              <Link
                key={post.slug}
                href={`/column/${post.slug}`}
                className="group block rounded-2xl border border-rm-border bg-rm-surface p-6 transition-all hover:border-rm-border-strong hover:shadow-sm"
              >
                <article>
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-rm-text-muted">
                    <span className="inline-flex items-center rounded-full bg-rm-accent-tint px-2.5 py-0.5 text-rm-accent-deep">
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
                  <h2 className="mt-3 text-[15px] font-medium text-rm-primary line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-rm-text-secondary line-clamp-3">
                    {post.description}
                  </p>
                  <span className="mt-4 inline-block text-[13px] font-medium text-rm-accent-deep group-hover:underline">
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
              className="mt-14 flex items-center justify-center gap-2"
            >
              {currentPage > 1 ? (
                <Link
                  href={currentPage === 2 ? "/column" : `/column/page/${currentPage - 1}`}
                  className="rounded-full border border-rm-border px-4 py-2 text-[13px] text-rm-text-secondary transition-colors hover:bg-rm-surface"
                >
                  ← 前へ
                </Link>
              ) : (
                <span className="rounded-full border border-rm-border/50 px-4 py-2 text-[13px] text-rm-text-muted/40">
                  ← 前へ
                </span>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Link
                    key={page}
                    href={page === 1 ? "/column" : `/column/page/${page}`}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
                      page === currentPage
                        ? "bg-rm-primary text-rm-bg"
                        : "border border-rm-border text-rm-text-secondary hover:bg-rm-surface"
                    }`}
                  >
                    {page}
                  </Link>
                )
              )}

              {currentPage < totalPages ? (
                <Link
                  href={`/column/page/${currentPage + 1}`}
                  className="rounded-full border border-rm-border px-4 py-2 text-[13px] text-rm-text-secondary transition-colors hover:bg-rm-surface"
                >
                  次へ →
                </Link>
              ) : (
                <span className="rounded-full border border-rm-border/50 px-4 py-2 text-[13px] text-rm-text-muted/40">
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
