import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "導入事例",
  description:
    "Roomlyを導入いただいた賃貸管理会社の事例をご紹介。導入効果・業務改善の実績をご覧ください。",
  alternates: { canonical: "/case-studies" },
  openGraph: {
    title: "導入事例 | Roomly",
    description:
      "Roomlyを導入いただいた賃貸管理会社の事例をご紹介。導入効果・業務改善の実績をご覧ください。",
    type: "website",
    url: "https://hp.roomly.jp/case-studies",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function CaseStudiesPage() {
  return (
    <>
      <section className="px-7 pt-20 pb-16 text-center sm:pt-28">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Case Studies</span>
          <h1 className="mt-6 text-[clamp(32px,5vw,56px)] font-medium leading-tight tracking-tight text-rm-primary">
            導入事例
          </h1>
          <p className="mt-5 text-[16px] text-rm-text-secondary">
            Roomlyを導入いただいた管理会社様の声をご紹介します。
          </p>
        </div>
      </section>

      <section className="px-7 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-rm-border bg-rm-surface p-10 text-center sm:p-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rm-accent-tint">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="mt-5 text-[18px] font-medium text-rm-primary">
              導入事例は準備中です
            </h2>
            <p className="mt-3 text-[15px] text-rm-text-secondary max-w-[28em] mx-auto">
              現在、導入いただいた管理会社様の事例を取材中です。掲載にご協力いただける方はお気軽にお問い合わせください。
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="inline-flex h-11 items-center rounded-full bg-rm-primary px-[20px] text-[14px] font-medium text-rm-bg transition-colors hover:bg-rm-accent-deep hover:text-white">
                お問い合わせ
              </Link>
              <a href="https://roomly.jp" className="inline-flex h-11 items-center rounded-full border border-rm-border-strong px-[20px] text-[14px] font-medium text-rm-primary transition-colors hover:bg-rm-surface-tint">
                無料で始める
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
