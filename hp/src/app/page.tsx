import {
  Building2,
  FileText,
  Banknote,
  Wrench,
  SendHorizonal,
  BarChart3,
  CheckCircle2,
  UserPlus,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { getAllArticles } from "@/lib/media";

const features = [
  {
    icon: Building2,
    title: "物件管理",
    description:
      "建物・部屋の情報を一元管理。間取り・設備・写真もまとめて。",
  },
  {
    icon: FileText,
    title: "契約管理",
    description:
      "契約の作成から更新・解約まで。特約や条件も見やすく整理。",
  },
  {
    icon: Banknote,
    title: "家賃管理",
    description:
      "請求・入金・滞納を一目で。督促のタイミングも見逃さない。",
  },
  {
    icon: Wrench,
    title: "修繕管理",
    description:
      "依頼の受付から業者手配、完了報告まで。対応漏れを防ぐ。",
  },
  {
    icon: SendHorizonal,
    title: "オーナー送金",
    description:
      "月次の精算・送金明細を自動で。管理費の差し引きも簡単に。",
  },
  {
    icon: BarChart3,
    title: "レポート",
    description:
      "稼働率・入金率・収支をダッシュボードで。オーナー報告書も自動生成。",
  },
];

const steps = [
  {
    icon: UserPlus,
    number: "1",
    title: "無料登録",
    description: "メールアドレスだけで、5分でアカウント作成",
  },
  {
    icon: Building2,
    number: "2",
    title: "物件登録",
    description: "物件・部屋の情報を入力。CSVインポートにも対応",
  },
  {
    icon: Rocket,
    number: "3",
    title: "運用開始",
    description: "すぐに使い始められます。サポートも充実",
  },
];

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Roomly",
    url: "https://hp.roomly.jp",
    description:
      "賃貸管理会社向けSaaS。物件・入居者・契約・家賃・修繕・オーナー送金を一つの画面で一元管理。10区画まで無料。",
    publisher: {
      "@type": "Organization",
      name: "Roomly",
      url: "https://hp.roomly.jp",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ヒーロー */}
      <section className="bg-rm-hero px-4 py-28 text-center text-white sm:py-36">
        <div className="mx-auto max-w-3xl animate-slide-up">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            賃貸管理を、
            <br className="sm:hidden" />
            もっとシンプルに。
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/60 sm:text-lg">
            物件・入居者・家賃・修繕——すべてを一つの画面で。
          </p>
          <div className="mt-10">
            <a
              href="https://roomly.jp"
              className="inline-block rounded bg-rm-accent px-10 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-rm-accent-light"
            >
              無料で始める
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[13px] text-white/50">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-rm-accent-light" />
              10区画まで無料
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-rm-accent-light" />
              クレジットカード不要
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-rm-accent-light" />
              最短5分で開始
            </span>
          </div>
        </div>
      </section>

      {/* 選ばれる理由 */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-xl font-semibold text-rm-primary sm:text-2xl">
            選ばれる理由
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { value: "¥0", label: "初期費用", sub: "導入コストゼロで始められます" },
              { value: "10区画", label: "無料で使える", sub: "小規模からでも安心のフリープラン" },
              { value: "5分", label: "で始められる", sub: "登録からすぐに利用開始" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded bg-rm-surface p-8 text-center shadow-sm"
              >
                <p className="text-3xl font-semibold tabular-nums text-rm-accent">{stat.value}</p>
                <p className="mt-1 text-[13px] font-medium text-rm-text">{stat.label}</p>
                <p className="mt-2 text-[12px] text-rm-text-muted">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3ステップ */}
      <section className="bg-rm-surface px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-xl font-semibold text-rm-primary sm:text-2xl">
            3ステップで始められます
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded bg-rm-accent/10 text-rm-accent">
                  <step.icon size={24} />
                </div>
                <div className="mx-auto mt-3 flex h-7 w-7 items-center justify-center rounded-full bg-rm-accent text-[12px] font-medium text-white">
                  {step.number}
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-rm-text">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] text-rm-text-secondary">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 機能紹介 */}
      <section id="features" className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-xl font-semibold text-rm-primary sm:text-2xl">
            必要な機能を、ひとつに
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[14px] text-rm-text-secondary">
            賃貸管理に必要な機能をすべて備えています。
            <br className="hidden sm:block" />
            複数のツールを行き来する必要はありません。
          </p>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded bg-rm-surface p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded bg-rm-accent/10 text-rm-accent">
                  <feature.icon size={20} />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-rm-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-rm-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section id="pricing" className="bg-rm-surface px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-xl">
          <h2 className="text-center text-xl font-semibold text-rm-primary sm:text-2xl">
            料金
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[14px] text-rm-text-secondary">
            10区画まで無料。それ以上は区画数に応じたシンプルな料金体系です。
          </p>
          <div className="mt-14 rounded bg-rm-surface p-8 shadow-sm border-t-3 border-t-rm-accent">
            <div className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-rm-accent">全機能利用可能</p>
              <div className="mt-3">
                <span className="text-4xl font-semibold tabular-nums text-rm-accent">¥0</span>
                <span className="ml-1 text-rm-text-muted">/ 10区画まで</span>
              </div>
            </div>
            <div className="mt-8 space-y-2 text-[13px] text-rm-text-secondary">
              <div className="flex items-center justify-between rounded bg-rm-bg p-3">
                <span>〜10区画</span>
                <span className="font-semibold text-rm-accent">無料</span>
              </div>
              <div className="flex items-center justify-between rounded bg-rm-bg p-3">
                <span>11〜50区画</span>
                <span className="font-semibold text-rm-text">¥5,000/月</span>
              </div>
              <div className="flex items-center justify-between rounded bg-rm-bg p-3">
                <span>51〜100区画</span>
                <span className="font-semibold text-rm-text">¥10,000/月</span>
              </div>
              <div className="flex items-center justify-between rounded bg-rm-bg p-3">
                <span>101区画〜</span>
                <span className="font-semibold text-rm-text">お問い合わせ</span>
              </div>
            </div>
            <ul className="mt-6 space-y-2 text-[13px] text-rm-text-secondary">
              {["初期費用なし", "全プラン全機能利用可能", "クレジットカード不要で開始", "メールサポート付き"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2
                      size={14}
                      className="shrink-0 text-rm-accent"
                    />
                    {item}
                  </li>
                )
              )}
            </ul>
            <a
              href="https://roomly.jp"
              className="mt-8 block rounded bg-rm-accent py-3 text-center text-[13px] font-medium text-white transition-colors hover:bg-rm-accent-light"
            >
              無料で始める
            </a>
          </div>
        </div>
      </section>

      {/* 最新コラム */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-xl font-semibold text-rm-primary sm:text-2xl">
            コラム
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[14px] text-rm-text-secondary">
            賃貸管理の業務改善に役立つ情報をお届けします
          </p>
          <div className="mt-10 space-y-3">
            {getAllArticles()
              .slice(0, 3)
              .map((post) => (
                <Link
                  key={post.slug}
                  href={`/column/${post.slug}`}
                  className="block rounded bg-rm-surface p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                >
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
                  <p className="mt-2 text-[14px] font-semibold text-rm-primary">
                    {post.title}
                  </p>
                </Link>
              ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/column"
              className="text-[14px] font-medium text-rm-accent transition-colors hover:text-rm-accent-light"
            >
              コラム一覧を見る →
            </Link>
          </div>
        </div>
      </section>

      {/* お問い合わせ導線 */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-rm-primary sm:text-2xl">
            お気軽にご相談ください
          </h2>
          <p className="mt-4 text-[14px] text-rm-text-secondary">
            導入のご検討・ご不明点・協業のご相談など、お気軽にお問い合わせください。
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded bg-rm-accent px-10 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-rm-accent-light"
          >
            お問い合わせはこちら
          </Link>
        </div>
      </section>
    </>
  );
}
