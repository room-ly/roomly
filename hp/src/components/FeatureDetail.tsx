import Link from "next/link";

type Section = {
  heading: string;
  body: string;
  bullets?: string[];
};

type Faq = {
  q: string;
  a: string;
};

type Props = {
  title: string;
  lead: string;
  sections: Section[];
  faqs?: Faq[];
  relatedColumns?: { slug: string; title: string }[];
  canonicalPath: string;
};

export function FeatureDetail({ title, lead, sections, faqs, relatedColumns, canonicalPath }: Props) {
  const faqJsonLd = faqs && faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  } : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "ホーム", "item": "https://hp.roomly.jp" },
      { "@type": "ListItem", "position": 2, "name": "機能", "item": "https://hp.roomly.jp/features" },
      { "@type": "ListItem", "position": 3, "name": title, "item": `https://hp.roomly.jp${canonicalPath}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <section className="px-7 pt-20 pb-12 sm:pt-28">
        <div className="mx-auto max-w-3xl">
          <nav className="mb-6 text-[12px] text-rm-text-tertiary">
            <Link href="/" className="hover:text-rm-accent-deep">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/features" className="hover:text-rm-accent-deep">機能</Link>
            <span className="mx-2">/</span>
            <span>{title}</span>
          </nav>
          <span className="eyebrow">Feature</span>
          <h1 className="mt-4 text-[clamp(28px,4.5vw,44px)] font-medium leading-tight tracking-tight text-rm-primary">
            {title}
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-rm-text-secondary">
            {lead}
          </p>
        </div>
      </section>

      <section className="px-7 pb-16">
        <div className="mx-auto max-w-3xl space-y-14">
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 className="text-[22px] font-medium text-rm-primary sm:text-[24px]">{s.heading}</h2>
              <p className="mt-4 text-[15px] leading-[1.9] text-rm-text-secondary whitespace-pre-line">
                {s.body}
              </p>
              {s.bullets && s.bullets.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-[14px] leading-relaxed text-rm-text-secondary">
                      <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-rm-accent-deep" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {faqs && faqs.length > 0 && (
        <section className="bg-rm-surface-tint px-7 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-[22px] font-medium text-rm-primary sm:text-[26px]">よくある質問</h2>
            <div className="mt-8 space-y-6">
              {faqs.map((f) => (
                <div key={f.q} className="rounded-2xl border border-rm-border bg-rm-surface p-6">
                  <h3 className="text-[15px] font-semibold text-rm-primary">Q. {f.q}</h3>
                  <p className="mt-3 text-[14px] leading-[1.9] text-rm-text-secondary whitespace-pre-line">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedColumns && relatedColumns.length > 0 && (
        <section className="px-7 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-[18px] font-medium text-rm-primary">関連するコラム</h2>
            <ul className="mt-5 space-y-2">
              {relatedColumns.map((c) => (
                <li key={c.slug}>
                  <Link href={`/column/${c.slug}`} className="text-[14px] text-rm-accent-deep hover:underline">
                    → {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="px-7 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(22px,3vw,30px)] font-medium tracking-tight text-rm-primary">
            まずは無料で試してみませんか？
          </h2>
          <p className="mt-4 text-[15px] text-rm-text-secondary">
            10区画まで無料。クレジットカード不要で、すぐに始められます。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="https://kanri.roomly.jp/login?demo=1" className="inline-flex h-12 items-center rounded-full bg-rm-accent-deep px-[22px] text-[15px] font-medium text-white transition-colors hover:opacity-90">
              デモを試す
            </a>
            <a href="https://kanri.roomly.jp/signup" className="inline-flex h-12 items-center rounded-full border border-rm-border-strong px-[22px] text-[15px] font-medium text-rm-primary transition-colors hover:bg-rm-surface">
              無料で始める
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
