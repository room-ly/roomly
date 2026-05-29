import type { Metadata } from "next";
import Link from "next/link";
import { getAllTerms, GLOSSARY_CATEGORIES, getTermsByCategory } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "賃貸管理・大家業務の用語集",
  description:
    "敷金・原状回復・サブリース・善管注意義務など、賃貸管理と大家業務で押さえておきたい用語を解説します。実務で迷ったときの辞書として使えます。",
  alternates: { canonical: "/glossary" },
  openGraph: {
    title: "賃貸管理・大家業務の用語集 | Roomly",
    description:
      "敷金・原状回復・サブリース・善管注意義務など、賃貸管理と大家業務で押さえておきたい用語を解説します。",
    type: "website",
    url: "https://hp.roomly.jp/glossary",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export const revalidate = 3600;

export default function GlossaryIndex() {
  const allTerms = getAllTerms();

  const definedTermSetJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "賃貸管理・大家業務の用語集",
    description:
      "賃貸管理と大家業務で使われる用語の解説集。契約・家賃・退去・修繕・管理委託・関連法令を網羅。",
    url: "https://hp.roomly.jp/glossary",
    inLanguage: "ja",
    hasDefinedTerm: allTerms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.description,
      url: `https://hp.roomly.jp/glossary/${t.slug}`,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: "https://hp.roomly.jp" },
      { "@type": "ListItem", position: 2, name: "用語集", item: "https://hp.roomly.jp/glossary" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSetJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="px-7 pt-20 pb-12 text-center sm:pt-28">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Glossary</span>
          <h1 className="mt-6 text-[clamp(32px,5vw,56px)] font-medium leading-tight tracking-tight text-rm-primary">
            賃貸管理用語集
          </h1>
          <p className="mt-5 text-[16px] text-rm-text-secondary">
            賃貸管理と大家業務で使われる用語を、実務目線で解説します。
          </p>
          <p className="mt-2 text-[13px] text-rm-text-muted">
            全{allTerms.length}語
          </p>
        </div>
      </section>

      <section className="px-7 pb-24">
        <div className="mx-auto max-w-4xl space-y-12">
          {GLOSSARY_CATEGORIES.map((cat) => {
            const terms = getTermsByCategory(cat.id);
            if (terms.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="border-b border-rm-border pb-3">
                  <h2 className="text-[18px] font-medium text-rm-primary">
                    {cat.label}
                    <span className="ml-2 text-[12px] text-rm-text-muted">({terms.length})</span>
                  </h2>
                  <p className="mt-1 text-[13px] text-rm-text-muted">{cat.description}</p>
                </div>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {terms.map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/glossary/${t.slug}`}
                        className="block rounded-xl border border-rm-border bg-rm-surface p-4 transition-all hover:border-rm-border-strong hover:shadow-sm"
                      >
                        <p className="text-[14px] font-medium text-rm-primary">{t.term}</p>
                        {t.reading && (
                          <p className="mt-0.5 text-[11px] text-rm-text-muted">{t.reading}</p>
                        )}
                        <p className="mt-2 line-clamp-2 text-[12px] text-rm-text-secondary">
                          {t.description}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
