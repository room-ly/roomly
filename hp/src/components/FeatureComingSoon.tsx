import Link from "next/link";

type Props = {
  title: string;
  lead: string;
  keywords?: string[];
};

export function FeatureComingSoon({ title, lead, keywords }: Props) {
  return (
    <>
      <section className="px-7 pt-20 pb-12 text-center sm:pt-28">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Feature</span>
          <h1 className="mt-6 text-[clamp(28px,4.5vw,48px)] font-medium leading-tight tracking-tight text-rm-primary">
            {title}
          </h1>
          <p className="mt-5 text-[16px] text-rm-text-secondary max-w-[34em] mx-auto">
            {lead}
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-rm-border bg-rm-surface px-4 py-2 text-[13px] text-rm-text-secondary">
            <span className="inline-block h-2 w-2 rounded-full bg-rm-accent-deep" />
            この機能の詳細ページは現在準備中です
          </div>
        </div>
      </section>

      {keywords && keywords.length > 0 && (
        <section className="px-7 pb-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-[13px] text-rm-text-tertiary">関連するキーワード</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {keywords.map((kw) => (
                <span key={kw} className="rounded-full border border-rm-border bg-rm-surface px-3 py-1 text-[12px] text-rm-text-secondary">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-7 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[15px] text-rm-text-secondary">
            機能の概要は{" "}
            <Link href="/features" className="text-rm-accent-deep underline underline-offset-2">
              機能一覧ページ
            </Link>
            {" "}でご覧いただけます。
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
