import Link from "next/link";
import { getAllArticles } from "@/lib/media";
import { Reveal } from "@/components/Reveal";
import { HeroVisual } from "@/components/HeroVisual";
import { MockProperties } from "@/components/mocks/MockProperties";
import { MockRent } from "@/components/mocks/MockRent";
import { MockRemit } from "@/components/mocks/MockRemit";

export const revalidate = 3600;

const CHECK_SVG = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-rm-accent-deep shrink-0">
    <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);



function Dot() {
  return <span className="mt-2 h-[5px] w-[5px] shrink-0 rounded-full bg-rm-accent" />;
}

function SectionHead({ eyebrow, children, desc }: { eyebrow: string; children: React.ReactNode; desc?: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 mb-14">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="text-[clamp(28px,4vw,48px)] font-medium leading-tight tracking-tight max-w-[18ch]">
        {children}
      </h2>
      {desc && <p className="text-[16px] text-rm-text-secondary max-w-[52ch]">{desc}</p>}
    </div>
  );
}

function Em({ children }: { children: React.ReactNode }) {
  return <em className="font-serif-display italic text-rm-accent-deep font-normal">{children}</em>;
}

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Roomly",
    url: "https://hp.roomly.jp",
    description: "賃貸管理会社向けSaaS。物件・入居者・契約・家賃・修繕・オーナー送金を一つの画面で一元管理。10区画まで無料。",
    publisher: { "@type": "Organization", name: "Roomly", url: "https://hp.roomly.jp" },
  };

  const articles = getAllArticles().slice(0, 3);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="overflow-hidden px-7 pt-20 pb-16 sm:pt-24 sm:pb-16">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 sm:grid-cols-[1.05fr_1fr] sm:gap-16">
          <div>
            <span className="eyebrow">SaaS for Property Management</span>
            <h1 className="mt-6 text-[clamp(40px,6vw,76px)] font-medium leading-[1.02] tracking-tight text-rm-primary">
              賃貸管理を、<br />
              <span className="font-serif-display italic text-rm-accent-deep">もっと、</span><br />
              シンプルに。
            </h1>
            <p className="mt-7 max-w-[30em] text-[18px] leading-relaxed text-rm-text-secondary">
              物件・入居者・契約・家賃・修繕・送金——すべてを一つの画面で。Excelとメールから卒業する、最小で十分なSaaS。
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="https://roomly.jp/login?demo=1" className="inline-flex h-12 items-center rounded-full border border-rm-border-strong px-[22px] text-[15px] font-medium text-rm-primary transition-colors hover:bg-rm-surface">
                デモを試す
              </a>
              <a href="https://roomly.jp/signup" className="inline-flex h-12 items-center gap-2 rounded-full bg-rm-primary px-[22px] text-[15px] font-medium text-rm-bg transition-colors hover:bg-rm-accent-deep hover:text-white">
                無料で始める
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-[18px] text-[13px] text-rm-text-muted">
              {["10区画まで無料", "クレカ不要", "最短5分"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">{CHECK_SVG} {t}</span>
              ))}
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* Stats */}
      <section className="px-7 pt-0">
        <Reveal className="mx-auto max-w-[1180px]">
          <div className="rounded-3xl bg-rm-primary text-rm-bg grid grid-cols-1 gap-6 p-8 sm:grid-cols-3 sm:p-12">
            {[
              { num: "¥0", unit: "初期", label: "導入コスト。クレカ不要で今日から使えます。" },
              { num: "10", unit: "区画", label: "までずっと無料。小規模管理にも安心。" },
              { num: "5", unit: "分", label: "登録から運用開始まで。Excelより速い。" },
            ].map((s) => (
              <div key={s.num} className="py-3">
                <div className="font-serif-display text-[64px] leading-none tracking-tight sm:text-[72px]">
                  {s.num}<small className="ml-1.5 align-super text-[0.4em] font-sans font-normal opacity-70">{s.unit}</small>
                </div>
                <div className="mt-3 text-[14px] opacity-70">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Feature Rows */}
      <section id="features" className="px-7 py-24">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead eyebrow="All-in-one" desc="賃貸管理に必要な機能をすべて備えています。複数のツールを行き来する必要はありません。">
            必要な機能を、<Em>ひとつに。</Em>
          </SectionHead>

          <Reveal>
            <div className="grid grid-cols-1 items-center gap-12 py-14 sm:grid-cols-2 sm:gap-16">
              <div>
                <span className="eyebrow">物件・部屋管理</span>
                <h3 className="mt-5 text-[32px] font-medium leading-tight tracking-tight sm:text-[36px]">建物も、部屋も、<Em>一望できる</Em>。</h3>
                <p className="mt-4 text-[16px] text-rm-text-secondary max-w-[32em]">建物・部屋・間取り・設備・写真をまとめて管理。空室状況はリアルタイムで反映されます。</p>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {["物件の基本情報（住所・構造・築年数）を登録", "各部屋の間取り・面積・家賃・管理費を管理", "空室／入居中ステータスをリアルタイム表示", "オーナー紐付けで送金管理もスムーズに"].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-[14px] text-rm-text-secondary"><Dot />{t}</li>
                  ))}
                </ul>
              </div>
              <MockProperties />
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 items-center gap-12 py-14 sm:grid-cols-2 sm:gap-16">
              <div className="sm:order-2">
                <span className="eyebrow">家賃管理</span>
                <h3 className="mt-5 text-[32px] font-medium leading-tight tracking-tight sm:text-[36px]">請求も入金も、<Em>見逃さない</Em>。</h3>
                <p className="mt-4 text-[16px] text-rm-text-secondary max-w-[32em]">月次の請求を自動生成。入金消込、滞納日数の自動カウント、督促のタイミングまで一画面に。</p>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {["毎月の家賃請求を自動生成", "入金消込（全額・部分・取消）", "滞納一覧と滞納日数の自動カウント", "色分けされた見やすいステータス表示"].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-[14px] text-rm-text-secondary"><Dot />{t}</li>
                  ))}
                </ul>
              </div>
              <MockRent />
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-1 items-center gap-12 py-14 sm:grid-cols-2 sm:gap-16">
              <div>
                <span className="eyebrow">修繕・オーナー送金</span>
                <h3 className="mt-5 text-[32px] font-medium leading-tight tracking-tight sm:text-[36px]">受付から精算まで、<Em>つながる</Em>。</h3>
                <p className="mt-4 text-[16px] text-rm-text-secondary max-w-[32em]">修繕依頼を受け付けたら、業者手配・完了報告・経費連携まで自動で繋がる。月末のオーナー送金もボタン一つ。</p>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {["修繕依頼を写真・優先度付きで登録", "対応ログをタイムラインで記録", "家賃収入 − 管理手数料 − 経費 を自動計算", "送金明細PDFを自動生成"].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-[14px] text-rm-text-secondary"><Dot />{t}</li>
                  ))}
                </ul>
              </div>
              <MockRemit />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Steps */}
      <section className="px-7 py-24">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead eyebrow="3 Steps">
            たった<Em>3ステップ</Em>で<br />はじめられます。
          </SectionHead>
          <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { num: "01", t: "無料登録", d: "メールアドレスだけで、5分でアカウント作成。クレジットカード不要。" },
              { num: "02", t: "物件登録", d: "物件・部屋の情報を入力。CSVインポートにも対応しているので一括登録もOK。" },
              { num: "03", t: "運用開始", d: "すぐに使い始められます。困ったらメールサポートがすぐに返信。" },
            ].map((s) => (
              <div key={s.num} className="rounded-2xl border border-rm-border bg-rm-surface p-7">
                <div className="font-serif-display italic text-[56px] leading-none text-rm-accent-deep tracking-tight">{s.num}</div>
                <h4 className="mt-4 text-[17px] font-semibold tracking-tight">{s.t}</h4>
                <p className="mt-2 text-[14px] text-rm-text-secondary">{s.d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-rm-surface-tint px-7 py-24">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead eyebrow="More Features" desc="毎日の業務を支える、地味で大事な機能たち。">
            もっと、<Em>細部まで</Em>。
          </SectionHead>
          <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "入居者管理", d: "個人情報・連絡先・保証人情報・契約履歴・支払履歴をまとめて。退去後の履歴も残せます。", icon: "users" },
              { t: "契約管理", d: "作成から更新・解約までライフサイクル全体をカバー。30日前に更新漏れアラート。", icon: "contract" },
              { t: "ダッシュボード", d: "稼働率・回収率・空室数・滞納件数をリアルタイムで。月次推移グラフで傾向を把握。", icon: "chart" },
              { t: "通知", d: "滞納発生・契約満了・修繕依頼をメールとアプリ内通知でお知らせ。見落とし防止。", icon: "bell" },
              { t: "権限管理", d: "管理者・マネージャー・スタッフ・閲覧者の4ロール。操作権限をきめ細かく制御。", icon: "shield" },
              { t: "CSV / PDF", d: "全データのCSV出力に対応。オーナー向け月次報告書PDFも自動生成。", icon: "send" },
            ].map((it) => (
              <div key={it.t} className="rounded-2xl border border-rm-border bg-rm-surface p-7 transition-all hover:-translate-y-1 hover:border-rm-border-strong hover:shadow-lg">
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-rm-accent-tint text-rm-accent-deep">
                  <FeatureIcon name={it.icon} />
                </div>
                <h4 className="text-[16px] font-semibold tracking-tight">{it.t}</h4>
                <p className="mt-2 text-[14px] text-rm-text-secondary leading-relaxed">{it.d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-rm-surface-tint px-7 py-24">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead eyebrow="Pricing" desc="10区画まで完全無料。全プランで全機能が使えます。">
            区画数で決まる、<Em>シンプル料金</Em>。
          </SectionHead>
          <Reveal className="mx-auto max-w-[900px] rounded-3xl border border-rm-border bg-rm-surface p-8 grid grid-cols-1 gap-10 sm:grid-cols-[1.1fr_1fr] sm:p-12 sm:gap-14">
            <div>
              <span className="eyebrow">All-in-one plan</span>
              <h3 className="mt-4 text-[36px] font-medium leading-tight tracking-tight sm:text-[42px]">
                すべての機能。<br /><Em>一つの料金で。</Em>
              </h3>
              <p className="mt-5 text-[15px] text-rm-text-secondary max-w-[30em]">機能制限なし。区画数に応じてフェアな価格で。いつでも解約できて違約金もありません。</p>
              <ul className="mt-6 flex flex-col gap-2.5">
                {["初期費用なし", "全機能利用可能", "クレジットカード不要で開始", "メールサポート付き", "いつでも解約・違約金なし"].map((x) => (
                  <li key={x} className="flex items-center gap-2.5 text-[14px] text-rm-text-secondary">{CHECK_SVG} {x}</li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <a href="https://roomly.jp/login?demo=1" className="inline-flex h-10 items-center rounded-full border border-rm-border-strong px-[18px] text-[14px] font-medium text-rm-primary transition-colors hover:bg-rm-surface-tint">デモを試す</a>
                <a href="https://roomly.jp/signup" className="inline-flex h-10 items-center gap-2 rounded-full bg-rm-primary px-[18px] text-[14px] font-medium text-rm-bg transition-colors hover:bg-rm-accent-deep hover:text-white">無料で始める</a>
              </div>
              <p className="mt-4 text-[12px] text-rm-text-muted">※ 10区画を超えても自動課金されません。カード登録・プラン切り替えはご自身のタイミングで。</p>
            </div>
            <div className="rounded-xl border border-rm-border bg-rm-bg overflow-hidden">
              {([
                ["〜10区画", "無料", true],
                ["〜50区画", "¥5,000 / 月", false],
                ["〜100区画", "¥10,000 / 月", false],
                ["〜300区画", "¥15,000 / 月", false],
                ["〜500区画", "¥20,000 / 月", false],
                ["〜1,000区画", "¥25,000 / 月", false],
                ["〜2,000区画", "¥30,000 / 月", false],
                ["2,001区画〜", "1,000区画ごとに +¥5,000", false],
              ] as [string, string, boolean][]).map(([range, price, free]) => (
                <div key={range} className={`flex items-center justify-between px-[18px] py-3.5 text-[14px] border-b border-rm-border last:border-b-0 ${free ? "bg-rm-accent-tint" : ""}`}>
                  <span>{range}</span>
                  <span className={`font-mono text-[13px] font-medium ${free ? "text-rm-accent-deep font-semibold" : "text-rm-text"}`}>{price}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <div className="mt-6 text-center">
            <Link href="/pricing" className="text-[14px] font-medium text-rm-accent transition-colors hover:text-rm-accent-light">料金の詳細はこちら →</Link>
          </div>
        </div>
      </section>

      {/* Columns */}
      <section id="column" className="px-7 py-24">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead eyebrow="Column" desc="業務改善・賃貸経営・テナント対応——実務に役立つ情報をお届けします。">
            賃貸管理の<Em>現場から</Em>。
          </SectionHead>
          <Reveal className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((post) => (
              <Link key={post.slug} href={`/column/${post.slug}`} className="flex flex-col rounded-2xl border border-rm-border bg-rm-surface p-[22px] min-h-[220px] transition-all hover:-translate-y-1 hover:shadow-lg">
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-rm-accent-deep">{post.category}</span>
                <h4 className="mt-3.5 flex-grow text-[17px] font-semibold leading-snug tracking-tight">{post.title}</h4>
                <span className="mt-3.5 text-[12px] text-rm-text-muted">
                  {new Date(post.date).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, ".")}
                </span>
              </Link>
            ))}
          </Reveal>
          <div className="mt-9 text-center">
            <Link href="/column" className="inline-flex h-10 items-center gap-2 rounded-full border border-rm-border-strong px-[18px] text-[14px] font-medium text-rm-primary transition-colors hover:bg-rm-surface">
              コラム一覧を見る
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-7 py-24">
        <Reveal className="mx-auto max-w-[1180px]">
          <div className="relative overflow-hidden rounded-3xl bg-rm-primary text-rm-bg px-8 py-20 text-center sm:px-12">
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px circle at 20% 0%, color-mix(in srgb, var(--rm-accent) 30%, transparent), transparent 60%), radial-gradient(500px circle at 80% 100%, color-mix(in srgb, var(--rm-accent) 18%, transparent), transparent 60%)" }} />
            <div className="relative">
              <h2 className="text-[clamp(32px,5vw,56px)] font-medium leading-tight tracking-tight">
                賃貸管理を、<br />
                <em className="font-serif-display italic font-normal" style={{ color: "color-mix(in srgb, var(--rm-accent) 70%, white)" }}>今日から変える。</em>
              </h2>
              <p className="mx-auto mt-6 max-w-[38em] text-[16px] opacity-65">10区画まで完全無料。クレジットカード不要、最短5分で始められます。</p>
              <div className="mt-9 inline-flex flex-wrap justify-center gap-3">
                <a href="https://roomly.jp/login?demo=1" className="inline-flex h-12 items-center rounded-full border px-[22px] text-[15px] font-medium text-rm-bg transition-colors hover:bg-white/10" style={{ borderColor: "color-mix(in srgb, var(--rm-bg) 25%, transparent)" }}>
                  デモを試す
                </a>
                <a href="https://roomly.jp/signup" className="inline-flex h-12 items-center gap-2 rounded-full bg-rm-bg px-[22px] text-[15px] font-medium text-rm-primary transition-colors hover:bg-rm-accent hover:text-white">
                  無料で始める
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function FeatureIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    users: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="9" cy="9" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M21 20a6 6 0 0 0-4-5.7" strokeLinecap="round" /></svg>,
    contract: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 12h7M9 16h5M9 8h3" strokeLinecap="round" /></svg>,
    chart: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 20V8M10 20V4M16 20v-8M22 20H2" strokeLinecap="round" /></svg>,
    bell: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 16V10a6 6 0 0 1 12 0v6l2 2H4z" strokeLinejoin="round" /><path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" /></svg>,
    shield: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" strokeLinejoin="round" /></svg>,
    send: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 12l16-8-4 16-4-6-8-2z" strokeLinejoin="round" /></svg>,
  };
  return <>{icons[name] || null}</>;
}
