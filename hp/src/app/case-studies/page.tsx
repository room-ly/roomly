import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Users, TrendingUp, Quote } from "lucide-react";

export const metadata: Metadata = {
  title: "導入事例",
  description:
    "Roomlyを導入いただいた賃貸管理会社の事例をご紹介。導入効果・業務改善の実績をご覧ください。",
};

// 事例テンプレート（今後実際の事例データで置き換える）
const caseStudies = [
  {
    id: "sample-1",
    company: "サンプル不動産管理 株式会社",
    area: "東京都新宿区",
    scale: "管理戸数 120戸",
    challenge: "Excelでの物件管理が限界に。家賃の入金確認に毎月3日以上かかっていた。",
    solution: "Roomlyで物件・家賃・送金を一元管理。入金消込のワンクリック化で作業時間を大幅短縮。",
    results: [
      { label: "入金確認時間", before: "3日", after: "2時間", icon: TrendingUp },
      { label: "管理スタッフ", before: "3名", after: "2名", icon: Users },
      { label: "滞納対応", before: "月末まとめて", after: "即日対応", icon: Building2 },
    ],
    quote: "Excelから移行するだけで、こんなに楽になるとは思いませんでした。",
    person: "代表取締役 山田太郎（仮名）",
    comingSoon: true,
  },
  {
    id: "sample-2",
    company: "サンプルホーム管理 合同会社",
    area: "大阪府大阪市",
    scale: "管理戸数 45戸",
    challenge: "オーナーへの月次報告書作成が毎月の大仕事。送金明細の計算ミスも発生していた。",
    solution: "Roomlyのオーナー送金機能で、明細PDF自動生成。計算ミスゼロに。",
    results: [
      { label: "報告書作成", before: "2日", after: "30分", icon: TrendingUp },
      { label: "計算ミス", before: "月1〜2件", after: "0件", icon: TrendingUp },
      { label: "オーナー満足度", before: "-", after: "向上", icon: Users },
    ],
    quote: "オーナーさんからの信頼度が上がりました。報告書のクオリティが違います。",
    person: "業務部長 佐藤花子（仮名）",
    comingSoon: true,
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      {/* ヒーロー */}
      <section className="bg-rm-hero px-4 py-20 text-center text-white sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            導入事例
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-white/60 sm:text-base">
            Roomlyを導入いただいた管理会社様の声をご紹介します。
          </p>
        </div>
      </section>

      {/* 事例一覧 */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-12">
          {caseStudies.map((cs) => (
            <article
              key={cs.id}
              className="overflow-hidden rounded-lg border border-rm-border bg-rm-surface shadow-sm"
            >
              {cs.comingSoon && (
                <div className="bg-rm-accent/10 px-6 py-2 text-center text-[12px] font-medium text-rm-accent">
                  この事例はサンプルです。実際の導入事例は準備中です。
                </div>
              )}

              <div className="p-6 sm:p-8">
                {/* 会社情報 */}
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-rm-primary">{cs.company}</h2>
                  <span className="rounded bg-rm-bg px-3 py-1 text-[12px] text-rm-text-muted">
                    {cs.area}
                  </span>
                  <span className="rounded bg-rm-bg px-3 py-1 text-[12px] text-rm-text-muted">
                    {cs.scale}
                  </span>
                </div>

                {/* 課題と解決策 */}
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-wider text-rm-text-muted">
                      導入前の課題
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-rm-text-secondary">
                      {cs.challenge}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-wider text-rm-accent">
                      Roomlyでの解決
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-rm-text-secondary">
                      {cs.solution}
                    </p>
                  </div>
                </div>

                {/* 導入効果 */}
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {cs.results.map((r) => (
                    <div key={r.label} className="rounded bg-rm-bg p-4 text-center">
                      <p className="text-[12px] text-rm-text-muted">{r.label}</p>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <span className="text-[13px] text-rm-text-muted line-through">{r.before}</span>
                        <span className="text-[12px] text-rm-text-muted">→</span>
                        <span className="text-[15px] font-semibold text-rm-accent">{r.after}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* お客様の声 */}
                <div className="mt-6 rounded bg-rm-bg p-5">
                  <div className="flex gap-3">
                    <Quote size={20} className="mt-0.5 shrink-0 text-rm-accent/40" />
                    <div>
                      <p className="text-[14px] leading-relaxed text-rm-text-secondary italic">
                        {cs.quote}
                      </p>
                      <p className="mt-2 text-[12px] text-rm-text-muted">
                        — {cs.person}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 事例募集 */}
      <section className="bg-rm-surface px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-rm-primary sm:text-2xl">
            導入事例を募集しています
          </h2>
          <p className="mt-4 text-[14px] text-rm-text-secondary">
            Roomlyをご利用いただいている管理会社様の声をお聞かせください。
            <br className="hidden sm:block" />
            掲載にご協力いただける方はお気軽にご連絡ください。
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded bg-rm-accent px-8 py-3 text-[14px] font-medium text-white transition-colors hover:bg-rm-accent-light"
          >
            お問い合わせはこちら
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-rm-primary sm:text-2xl">
            まずは無料で試してみませんか？
          </h2>
          <p className="mt-4 text-[14px] text-rm-text-secondary">
            10区画まで無料。クレジットカード不要で、すぐに始められます。
          </p>
          <a
            href="https://roomly.jp"
            className="mt-8 inline-block rounded bg-rm-accent px-10 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-rm-accent-light"
          >
            無料で始める
          </a>
        </div>
      </section>
    </>
  );
}
