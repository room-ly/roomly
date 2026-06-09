import Link from "next/link";
import type { ReactNode } from "react";
import type { TemplateTool } from "@/lib/tools";

interface RelatedLink {
  href: string;
  label: string;
}

interface TemplatePageProps {
  tool: TemplateTool;
  lead: string; // リード文（h1直下）
  children: ReactNode; // SEO本文（h2セクション群）
  relatedGlossary?: RelatedLink[];
  relatedColumns?: RelatedLink[];
  ctaHeading: string;
  ctaText: string;
}

export default function TemplatePage({
  tool,
  lead,
  children,
  relatedGlossary,
  relatedColumns,
  ctaHeading,
  ctaText,
}: TemplatePageProps) {
  const url = `https://hp.roomly.jp/tools/${tool.slug}`;
  const fileUrl = `/templates/${tool.file}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: "https://hp.roomly.jp" },
      { "@type": "ListItem", position: 2, name: "ツール・テンプレート", item: "https://hp.roomly.jp/tools" },
      { "@type": "ListItem", position: 3, name: tool.title, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="px-7 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <nav className="mb-8 text-[13px] text-rm-text-muted">
            <Link href="/" className="transition-colors hover:text-rm-accent-deep">トップ</Link>
            <span className="mx-2">/</span>
            <Link href="/tools" className="transition-colors hover:text-rm-accent-deep">ツール・テンプレート</Link>
            <span className="mx-2">/</span>
            <span className="text-rm-text-secondary">{tool.title}</span>
          </nav>

          <span className="inline-flex items-center rounded-full bg-rm-accent-tint px-2.5 py-0.5 text-[11px] font-medium text-rm-accent-deep">
            {tool.format}・無料
          </span>

          <h1 className="mt-4 text-[26px] font-medium leading-snug text-rm-primary sm:text-[30px]">
            {tool.title}
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-rm-text-secondary">{lead}</p>

          {/* ダウンロードボックス */}
          <div className="mt-8 rounded-2xl border border-rm-border bg-rm-surface p-6 sm:p-8">
            <p className="text-[14px] font-medium text-rm-primary">無料ダウンロード</p>
            <p className="mt-1 text-[13px] text-rm-text-secondary">
              会員登録不要・{tool.format}形式（{tool.file.split(".").pop()?.toUpperCase()}）
            </p>
            <a
              href={fileUrl}
              download
              className="mt-4 inline-flex h-12 items-center rounded-full bg-rm-accent px-7 text-[15px] font-medium text-white transition-colors hover:bg-rm-accent-deep"
            >
              テンプレートをダウンロード
            </a>
          </div>

          <div className="mt-12 space-y-12">{children}</div>

          {relatedGlossary && relatedGlossary.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[18px] font-medium text-rm-primary">関連する用語</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {relatedGlossary.map((g) => (
                  <Link
                    key={g.href}
                    href={g.href}
                    className="inline-flex items-center rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary transition-colors hover:border-rm-border-strong hover:text-rm-primary"
                  >
                    {g.label}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {relatedColumns && relatedColumns.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[18px] font-medium text-rm-primary">関連コラム</h2>
              <div className="mt-5 space-y-3">
                {relatedColumns.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="block rounded-2xl border border-rm-border bg-rm-surface p-5 transition-all hover:border-rm-border-strong hover:shadow-sm"
                  >
                    <p className="text-[14px] font-medium text-rm-primary">{c.label}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-14 rounded-2xl bg-rm-primary p-8 text-center sm:p-10">
            <h2 className="text-[18px] font-medium text-rm-bg">{ctaHeading}</h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] text-rm-bg/60">{ctaText}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="https://kanri.roomly.jp/login?demo=1"
                className="inline-flex h-11 items-center rounded-full bg-rm-bg px-[20px] text-[14px] font-medium text-rm-primary transition-colors hover:bg-rm-accent-tint"
              >
                会員登録不要でデモを試す
              </a>
              <a
                href="https://kanri.roomly.jp/signup"
                className="inline-flex h-11 items-center rounded-full border border-rm-bg/30 px-[20px] text-[14px] font-medium text-rm-bg transition-colors hover:bg-rm-bg/10"
              >
                無料で始める
              </a>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

// 本文セクションの共通ラッパ
export function TemplateSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[18px] font-medium text-rm-primary">{title}</h2>
      <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-rm-text-secondary">
        {children}
      </div>
    </section>
  );
}
