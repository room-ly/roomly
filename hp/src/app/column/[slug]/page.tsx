import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts, posts } from "@/lib/column";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | コラム`,
    description: post.description,
    alternates: {
      canonical: `https://hp.roomly.jp/column/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      url: `https://hp.roomly.jp/column/${post.slug}`,
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
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts().filter((p) => p.slug !== slug);
  const relatedPosts = allPosts.slice(0, 3);

  const contentHtml = post.content
    .split("\n")
    .map((line) => {
      if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("**") && line.endsWith("**"))
        return `<p><strong>${line.slice(2, -2)}</strong></p>`;
      if (line.startsWith("- ")) {
        const item = line.slice(2)
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        return `<p class="ml-4">・${item}</p>`;
      }
      if (line.trim() === "") return "";
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      return `<p>${formatted}</p>`;
    })
    .join("\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
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
        name: post.title,
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
            <span className="text-rm-text-secondary">{post.title}</span>
          </nav>

          {/* メタ情報 */}
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

          {/* タイトル */}
          <h1 className="mt-4 text-xl font-semibold leading-snug text-rm-primary sm:text-2xl">
            {post.title}
          </h1>

          {/* 本文 */}
          <div
            className="prose-rm mt-10"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

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
