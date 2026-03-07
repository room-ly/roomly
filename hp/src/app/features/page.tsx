import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  FileText,
  Banknote,
  Wrench,
  SendHorizonal,
  BarChart3,
  Users,
  ClipboardList,
  Shield,
  Bell,
  Download,
  Search,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "機能紹介",
  description:
    "Roomlyの全機能を紹介。物件管理・契約管理・家賃管理・修繕管理・オーナー送金・レポートなど、賃貸管理に必要な機能をすべて備えています。",
};

const mainFeatures = [
  {
    icon: Building2,
    title: "物件・部屋管理",
    description:
      "建物・部屋の情報を一元管理。間取り・設備・写真もまとめて登録できます。空室状況もリアルタイムに確認可能。",
    details: [
      "物件の基本情報（住所・構造・築年数・総部屋数）を登録",
      "各部屋の間取り・面積・家賃・管理費を管理",
      "空室・入居中のステータスをリアルタイム表示",
      "オーナーとの紐付けで送金管理もスムーズに",
    ],
  },
  {
    icon: Users,
    title: "入居者管理",
    description:
      "入居者の個人情報・連絡先・緊急連絡先・保証人情報をまとめて管理。契約履歴や支払い状況もひと目で確認できます。",
    details: [
      "入居者の基本情報・連絡先をまとめて管理",
      "契約履歴と支払い履歴を一覧表示",
      "滞納状況のアラート表示",
      "退去済み入居者の履歴も保持",
    ],
  },
  {
    icon: FileText,
    title: "契約管理",
    description:
      "契約の作成から更新・解約まで、ライフサイクル全体をカバー。特約や条件も見やすく整理できます。",
    details: [
      "契約作成: 物件→部屋→入居者→条件のステップ形式",
      "契約更新・解約処理もワンクリック",
      "満了30日前に自動ハイライトで更新漏れを防止",
      "敷金精算・原状回復費用も管理",
    ],
  },
  {
    icon: Banknote,
    title: "家賃管理",
    description:
      "請求・入金・滞納を一目で把握。督促のタイミングも見逃しません。",
    details: [
      "月次の家賃請求を自動生成",
      "入金消込（全額・部分入金・取消）",
      "滞納一覧と滞納日数の自動カウント",
      "ステータス色分けで視認性の高い一覧表示",
    ],
  },
  {
    icon: Wrench,
    title: "修繕管理",
    description:
      "依頼の受付から業者手配、完了報告まで。対応漏れを防ぎ、物件の価値を維持します。",
    details: [
      "修繕依頼の登録（カテゴリ・優先度・写真添付）",
      "対応ログをタイムライン形式で記録",
      "完了時に経費を自動連携",
      "未対応案件のアラート通知",
    ],
  },
  {
    icon: SendHorizonal,
    title: "オーナー送金",
    description:
      "月次の精算・送金明細を自動で作成。管理費の差し引きも計算不要です。",
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
    icon: BarChart3,
    title: "ダッシュボード",
    description: "入居率・回収率・空室数・滞納件数などのKPIをリアルタイムで確認。月次推移グラフで傾向も把握。",
  },
  {
    icon: ClipboardList,
    title: "問い合わせ管理",
    description: "入居者からのクレーム・問い合わせを受付・対応履歴付きで管理。ステータス追跡で対応漏れを防止。",
  },
  {
    icon: Shield,
    title: "権限管理（RBAC）",
    description: "管理者・マネージャー・スタッフ・閲覧者の4ロールで、操作権限をきめ細かく制御。",
  },
  {
    icon: Bell,
    title: "通知機能",
    description: "滞納発生・契約満了・修繕依頼をメールとアプリ内通知でお知らせ。見落とし防止に。",
  },
  {
    icon: Download,
    title: "CSV/PDFエクスポート",
    description: "物件・入居者・家賃データのCSV出力。オーナー向け月次報告書PDFも自動生成。",
  },
  {
    icon: Search,
    title: "検索・フィルタ・ソート",
    description: "全画面で横断検索・ステータスフィルタ・ソート・ページネーションに対応。",
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* ヒーロー */}
      <section className="bg-rm-hero px-4 py-20 text-center text-white sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            賃貸管理に必要な機能を、すべてひとつに
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-white/60 sm:text-base">
            物件・入居者・契約・家賃・修繕・送金——
            <br className="hidden sm:block" />
            複数のツールを行き来する必要はもうありません。
          </p>
        </div>
      </section>

      {/* メイン機能 */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl space-y-20">
          {mainFeatures.map((feature, i) => (
            <div
              key={feature.title}
              className={`flex flex-col gap-8 sm:gap-12 ${
                i % 2 === 1 ? "sm:flex-row-reverse" : "sm:flex-row"
              } items-start`}
            >
              {/* スクリーンショットプレースホルダー */}
              <div className="w-full sm:w-1/2">
                <div className="flex aspect-video items-center justify-center rounded-lg bg-rm-surface shadow-sm border border-rm-border">
                  <div className="text-center">
                    <feature.icon size={48} className="mx-auto text-rm-accent/40" />
                    <p className="mt-3 text-[12px] text-rm-text-muted">
                      {feature.title}の画面イメージ
                    </p>
                  </div>
                </div>
              </div>

              {/* 説明 */}
              <div className="w-full sm:w-1/2">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-rm-accent/10 text-rm-accent">
                  <feature.icon size={20} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-rm-primary sm:text-xl">
                  {feature.title}
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-rm-text-secondary">
                  {feature.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2.5 text-[13px] text-rm-text-secondary">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-rm-accent" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* その他の機能 */}
      <section className="bg-rm-surface px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-xl font-semibold text-rm-primary sm:text-2xl">
            さらに便利な機能
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded bg-white p-6 shadow-sm dark:bg-[var(--rm-bg)]"
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

      {/* CTA */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-rm-primary sm:text-2xl">
            まずは無料で試してみませんか？
          </h2>
          <p className="mt-4 text-[14px] text-rm-text-secondary">
            10区画まで無料。クレジットカード不要で、すぐに始められます。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="https://roomly.jp"
              className="rounded bg-rm-accent px-8 py-3 text-[14px] font-medium text-white transition-colors hover:bg-rm-accent-light"
            >
              無料で始める
            </a>
            <Link
              href="/contact"
              className="rounded border border-rm-border px-8 py-3 text-[14px] font-medium text-rm-text-secondary transition-colors hover:bg-rm-surface"
            >
              お問い合わせ
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
