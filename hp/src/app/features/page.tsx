import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "機能紹介",
  description:
    "Roomlyの全機能を紹介。物件管理・契約管理・家賃管理・修繕管理・オーナー送金・レポートなど、賃貸管理に必要な機能をすべて備えています。",
  alternates: { canonical: "/features" },
  openGraph: {
    title: "機能紹介 | Roomly",
    description:
      "Roomlyの全機能を紹介。物件管理・契約管理・家賃管理・修繕管理・オーナー送金・レポートなど、賃貸管理に必要な機能をすべて備えています。",
    type: "website",
    url: "https://hp.roomly.jp/features",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

const CHECK = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-rm-accent-deep shrink-0">
    <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const mainFeatures = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <path d="M3 21h18M3 7v14m6-14v14m6-14v14m6-14v14M6 3h12l3 4H3l3-4z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "物件・部屋管理",
    image: "/images/features/properties.png",
    description: "建物・部屋の情報を一元管理。間取り・設備・写真もまとめて登録できます。空室状況もリアルタイムに確認可能。",
    details: [
      "物件の基本情報（住所・構造・築年数・総部屋数）を登録",
      "各部屋の間取り・面積・家賃・管理費を管理",
      "空室・入居中のステータスをリアルタイム表示",
      "オーナーとの紐付けで送金管理もスムーズに",
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "入居者管理",
    image: "/images/features/tenants.png",
    description: "入居者の個人情報・連絡先・緊急連絡先・保証人情報をまとめて管理。契約履歴や支払い状況もひと目で確認できます。",
    details: [
      "入居者の基本情報・連絡先をまとめて管理",
      "契約履歴と支払い履歴を一覧表示",
      "滞納状況のアラート表示",
      "退去済み入居者の履歴も保持",
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "契約管理",
    image: "/images/features/contracts.png",
    description: "契約の作成から更新・解約まで、ライフサイクル全体をカバー。特約や条件も見やすく整理できます。",
    details: [
      "契約作成: 物件→部屋→入居者→条件のステップ形式",
      "契約更新・解約処理もワンクリック",
      "満了30日前に自動ハイライトで更新漏れを防止",
      "敷金精算・原状回復費用も管理",
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <path d="M2 17a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10zm4-5h4m4 0h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "家賃管理",
    image: "/images/features/rent.png",
    description: "請求・入金・滞納を一目で把握。督促のタイミングも見逃しません。",
    details: [
      "月次の家賃請求を自動生成",
      "入金消込（全額・部分入金・取消）",
      "滞納一覧と滞納日数の自動カウント",
      "ステータス色分けで視認性の高い一覧表示",
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "修繕管理",
    image: "/images/features/maintenance.png",
    description: "依頼の受付から業者手配、完了報告まで。対応漏れを防ぎ、物件の価値を維持します。",
    details: [
      "修繕依頼の登録（カテゴリ・優先度・写真添付）",
      "対応ログをタイムライン形式で記録",
      "完了時に経費を自動連携",
      "未対応案件のアラート通知",
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "オーナー送金",
    image: "/images/features/remittance.png",
    description: "月次の精算・送金明細を自動で作成。管理費の差し引きも計算不要です。",
    details: [
      "家賃収入 - 管理手数料 - 経費 = 送金額を自動計算",
      "オーナーごとの手数料率設定",
      "送金明細PDF（月次報告書）の自動生成",
      "ステータス管理（下書き→確定→送金済み）",
    ],
  },
];

const additionalFeatures = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "ダッシュボード",
    description: "入居率・回収率・空室数・滞納件数などのKPIをリアルタイムで確認。月次推移グラフで傾向も把握。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6m-5 4h4m-4 4h4m-4 4h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "問い合わせ管理",
    description: "入居者からのクレーム・問い合わせを受付・対応履歴付きで管理。ステータス追跡で対応漏れを防止。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "権限管理（RBAC）",
    description: "管理者・マネージャー・スタッフ・閲覧者の4ロールで、操作権限をきめ細かく制御。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "通知機能",
    description: "滞納発生・契約満了・修繕依頼をメールとアプリ内通知でお知らせ。見落とし防止に。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "CSV/PDFエクスポート",
    description: "物件・入居者・家賃データのCSV出力。オーナー向け月次報告書PDFも自動生成。",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rm-accent-deep">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "検索・フィルタ・ソート",
    description: "全画面で横断検索・ステータスフィルタ・ソート・ページネーションに対応。",
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* ヒーロー */}
      <section className="px-7 pt-20 pb-16 text-center sm:pt-28">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Features</span>
          <h1 className="mt-6 text-[clamp(32px,5vw,56px)] font-medium leading-tight tracking-tight text-rm-primary">
            賃貸管理に必要な機能を、<br />
            <em className="font-serif-display italic text-rm-accent-deep font-normal">すべてひとつに</em>。
          </h1>
          <p className="mt-5 text-[16px] text-rm-text-secondary max-w-[32em] mx-auto">
            物件・入居者・契約・家賃・修繕・送金——複数のツールを行き来する必要はもうありません。
          </p>
        </div>
      </section>

      {/* メイン機能 */}
      <section className="px-7 pb-24">
        <div className="mx-auto max-w-[1180px] space-y-20">
          {mainFeatures.map((feature, i) => (
            <Reveal key={feature.title}>
              <div className={`flex flex-col gap-10 sm:gap-14 ${i % 2 === 1 ? "sm:flex-row-reverse" : "sm:flex-row"} items-start`}>
                <div className="w-full sm:w-1/2">
                  <div className="overflow-hidden rounded-2xl border border-rm-border bg-rm-surface shadow-sm">
                    <Image
                      src={feature.image}
                      alt={`${feature.title}の画面`}
                      width={1600}
                      height={900}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-1/2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rm-accent-tint">
                    {feature.icon}
                  </div>
                  <h2 className="mt-4 text-[20px] font-medium text-rm-primary sm:text-[22px]">{feature.title}</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-rm-text-secondary">{feature.description}</p>
                  <ul className="mt-5 space-y-2.5">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2.5 text-[14px] text-rm-text-secondary">
                        {CHECK} {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* その他の機能 */}
      <section className="bg-rm-surface-tint px-7 py-24">
        <div className="mx-auto max-w-[1180px]">
          <div className="text-center">
            <span className="eyebrow">More features</span>
            <h2 className="mt-4 text-[clamp(24px,3vw,36px)] font-medium tracking-tight text-rm-primary">
              さらに便利な機能
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature) => (
              <Reveal key={feature.title}>
                <div className="rounded-2xl border border-rm-border bg-rm-surface p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rm-accent-tint">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold text-rm-primary">{feature.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-rm-text-secondary">{feature.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-7 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(24px,3vw,36px)] font-medium tracking-tight text-rm-primary">
            まずは無料で試してみませんか？
          </h2>
          <p className="mt-4 text-[15px] text-rm-text-secondary">
            10区画まで無料。クレジットカード不要で、すぐに始められます。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="https://roomly.jp/login?demo=1" className="inline-flex h-12 items-center rounded-full border border-rm-border-strong px-[22px] text-[15px] font-medium text-rm-primary transition-colors hover:bg-rm-surface">
              デモを試す
            </a>
            <a href="https://roomly.jp/signup" className="inline-flex h-12 items-center rounded-full bg-rm-primary px-[22px] text-[15px] font-medium text-rm-bg transition-colors hover:bg-rm-accent-deep hover:text-white">
              無料で始める
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
