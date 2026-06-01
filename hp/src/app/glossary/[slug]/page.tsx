import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import {
  getTerm,
  getAllSlugs,
  getAllTerms,
  GLOSSARY_CATEGORIES,
} from "@/lib/glossary";
import { getArticle } from "@/lib/media";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const term = getTerm(slug);
  if (!term) return {};

  return {
    title: `${term.term}とは | 賃貸管理用語集`,
    description: term.description,
    alternates: {
      canonical: `https://hp.roomly.jp/glossary/${slug}`,
    },
    openGraph: {
      title: `${term.term}とは`,
      description: term.description,
      type: "article",
      url: `https://hp.roomly.jp/glossary/${slug}`,
      siteName: "Roomly",
      locale: "ja_JP",
    },
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = getTerm(slug);
  if (!term) notFound();

  const allTerms = getAllTerms();
  const categoryLabel =
    GLOSSARY_CATEGORIES.find((c) => c.id === term.category)?.label ?? "用語";

  const relatedTerms = (term.relatedSlugs || [])
    .map((s) => allTerms.find((t) => t.slug === s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const sameCategoryTerms = allTerms
    .filter((t) => t.category === term.category && t.slug !== term.slug)
    .slice(0, 6);

  const relatedColumnArticles = (term.relatedColumns || [])
    .map((s) => getArticle(s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.description,
    inDefinedTermSet: "https://hp.roomly.jp/glossary",
    url: `https://hp.roomly.jp/glossary/${slug}`,
    inLanguage: "ja",
    ...(term.aliases && term.aliases.length > 0
      ? { alternateName: term.aliases }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: "https://hp.roomly.jp" },
      { "@type": "ListItem", position: 2, name: "用語集", item: "https://hp.roomly.jp/glossary" },
      {
        "@type": "ListItem",
        position: 3,
        name: term.term,
        item: `https://hp.roomly.jp/glossary/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="px-7 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <nav className="mb-8 text-[13px] text-rm-text-muted">
            <Link href="/" className="transition-colors hover:text-rm-accent-deep">トップ</Link>
            <span className="mx-2">/</span>
            <Link href="/glossary" className="transition-colors hover:text-rm-accent-deep">用語集</Link>
            <span className="mx-2">/</span>
            <span className="text-rm-text-secondary">{term.term}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3 text-[12px] text-rm-text-muted">
            <span className="inline-flex items-center rounded-full bg-rm-accent-tint px-2.5 py-0.5 text-rm-accent-deep">
              {categoryLabel}
            </span>
            {term.reading && <span>{term.reading}</span>}
          </div>

          <h1 className="mt-4 text-[26px] font-medium leading-snug text-rm-primary sm:text-[30px]">
            {term.term}
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-rm-text-secondary">
            {term.description}
          </p>

          {term.aliases && term.aliases.length > 0 && (
            <p className="mt-3 text-[12px] text-rm-text-muted">
              別名: {term.aliases.join(" / ")}
            </p>
          )}

          <div className="prose-rm mt-10">
            <MDXRemote
              source={term.content}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </div>

          {relatedColumnArticles.length > 0 && (
            <div className="mt-14 rounded-2xl border border-rm-border bg-rm-surface p-6">
              <h2 className="text-[14px] font-medium text-rm-primary">関連コラム</h2>
              <ul className="mt-4 space-y-3">
                {relatedColumnArticles.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/column/${a.slug}`}
                      className="block text-[13px] text-rm-accent-deep hover:underline"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-12 rounded-2xl bg-rm-primary p-8 text-center sm:p-10">
            <h2 className="text-[17px] font-medium text-rm-bg">
              Roomlyで賃貸管理をもっとシンプルに
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] text-rm-bg/60">
              10区画まで無料。クレジットカード不要で、今すぐ始められます。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="https://kanri.roomly.jp/login?demo=1"
                className="inline-flex h-11 items-center rounded-full bg-rm-bg px-[20px] text-[14px] font-medium text-rm-primary transition-colors hover:bg-rm-accent-tint"
              >
                デモを試す
              </a>
              <a
                href="https://kanri.roomly.jp/signup"
                className="inline-flex h-11 items-center rounded-full border border-rm-bg/30 px-[20px] text-[14px] font-medium text-rm-bg transition-colors hover:bg-rm-bg/10"
              >
                無料で始める
              </a>
            </div>
          </div>

          {(relatedTerms.length > 0 || sameCategoryTerms.length > 0) && (
            <div className="mt-14">
              <h2 className="text-[14px] font-medium text-rm-primary">関連用語</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...relatedTerms, ...sameCategoryTerms]
                  .filter(
                    (t, i, arr) => arr.findIndex((x) => x.slug === t.slug) === i
                  )
                  .slice(0, 10)
                  .map((t) => (
                    <Link
                      key={t.slug}
                      href={`/glossary/${t.slug}`}
                      className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
                    >
                      {t.term}
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
