import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getArticle, getAllSlugs, getAllArticles } from "@/lib/media";
import { BarChartMDX, LineChartMDX, PieChartMDX } from "@/components/charts";
import Comments from "@/components/Comments";

const mdxComponents = {
  BarChart: BarChartMDX,
  LineChart: LineChartMDX,
  PieChart: PieChartMDX,
};

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  return {
    title: `${article.title} | コラム`,
    description: article.description,
    alternates: {
      canonical: `https://hp.roomly.jp/column/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
      modifiedTime: article.lastModified || article.date,
      url: `https://hp.roomly.jp/column/${slug}`,
      siteName: "Roomly",
      locale: "ja_JP",
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const allArticles = getAllArticles().filter((a) => a.slug !== slug);
  // 同カテゴリの記事を優先し、足りなければ他カテゴリで補完
  const sameCategoryPosts = allArticles.filter((a) => a.category === article.category);
  const otherPosts = allArticles.filter((a) => a.category !== article.category);
  const relatedPosts = [...sameCategoryPosts, ...otherPosts].slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.lastModified || article.date,
    author: {
      "@type": "Organization",
      name: "Roomly",
      url: "https://hp.roomly.jp",
    },
    publisher: {
      "@type": "Organization",
      name: "Roomly",
      url: "https://hp.roomly.jp",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://hp.roomly.jp/column/${slug}`,
    },
    ...(article.tags.length > 0
      ? { keywords: article.tags.join(", ") }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "トップ",
        item: "https://hp.roomly.jp",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "コラム",
        item: "https://hp.roomly.jp/column",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `https://hp.roomly.jp/column/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* 記事 */}
      <article className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {/* パンくず */}
          <nav className="mb-8 text-[13px] text-rm-text-muted">
            <Link href="/" className="transition-colors hover:text-rm-accent">
              トップ
            </Link>
            <span className="mx-2">/</span>
            <Link href="/column" className="transition-colors hover:text-rm-accent">
              コラム
            </Link>
            <span className="mx-2">/</span>
            <span className="text-rm-text-secondary">{article.title}</span>
          </nav>

          {/* メタ情報 */}
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-rm-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rm-accent" />
              {article.category}
            </span>
            <time dateTime={article.date}>
              {new Date(article.date).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {article.lastModified && article.lastModified !== article.date && (
              <span className="text-rm-text-muted">
                （更新: {article.lastModified}）
              </span>
            )}
          </div>

          {/* タイトル */}
          <h1 className="mt-4 text-xl font-semibold leading-snug text-rm-primary sm:text-2xl">
            {article.title}
          </h1>

          {/* タグ */}
          {article.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded bg-rm-surface border border-rm-border text-rm-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 本文 */}
          <div className="prose-rm mt-10">
            <MDXRemote
              source={article.content}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
              components={mdxComponents}
            />
          </div>

          {/* CTA */}
          <div className="mt-16 rounded bg-rm-hero p-8 text-center text-white sm:p-12">
            <h2 className="text-lg font-semibold sm:text-xl">
              Roomlyで賃貸管理をもっとシンプルに
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] text-white/50">
              10区画まで無料。クレジットカード不要で、今すぐ始められます。
            </p>
            <a
              href="https://roomly.jp"
              className="mt-6 inline-block rounded bg-rm-accent px-8 py-3 text-[13px] font-medium text-white transition-colors hover:bg-rm-accent-light"
            >
              無料で始める
            </a>
          </div>

          {/* コメント */}
          <Comments project="roomly" articleSlug={slug} />

          {/* 関連記事 */}
          {relatedPosts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-[15px] font-semibold text-rm-primary">関連コラム</h2>
              <div className="mt-6 space-y-3">
                {relatedPosts.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/column/${p.slug}`}
                    className="block rounded bg-rm-surface p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <p className="text-[11px] text-rm-text-muted">
                      {p.category} ・{" "}
                      {new Date(p.date).toLocaleDateString("ja-JP")}
                    </p>
                    <p className="mt-1 text-[13px] font-medium text-rm-primary">{p.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
