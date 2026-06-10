// /tools 配下のツール・テンプレートを一元管理する定義。
// tools一覧ページ・sitemap・各ページがここを参照する（slug追加漏れ防止）。

export interface CalculatorTool {
  slug: string;
  title: string;
  description: string;
}

export interface TemplateTool {
  slug: string; // /tools/{slug} のページ
  title: string;
  description: string;
  file: string; // public/templates/ 配下のファイル名
  format: "Excel" | "Word";
}

// インタラクティブな計算ツール
export const CALCULATOR_TOOLS: CalculatorTool[] = [
  {
    slug: "management-fee",
    title: "管理委託費シミュレーター",
    description:
      "家賃と戸数から、管理会社への月額委託費の相場レンジを計算します。集金代行・フル委託の違いも比較できます。",
  },
  {
    slug: "restoration-burden",
    title: "原状回復 負担割合計算",
    description:
      "国土交通省ガイドラインに基づき、退去時の大家・入居者の負担割合を耐用年数と入居期間から算出します。",
  },
  {
    slug: "vacancy-loss",
    title: "空室損失シミュレーター",
    description:
      "空室期間と家賃から、機会損失と募集コストの合計額を可視化します。客付け価値を数字で証明できます。",
  },
  {
    slug: "self-vs-outsource",
    title: "委託vs自主管理 損益分岐",
    description:
      "物件数と時間コストから、自主管理と管理委託のどちらが得かを計算。何戸目から委託が合理的になるかが分かります。",
  },
];

// ダウンロードできるテンプレート（Excel / Word）
export const TEMPLATE_TOOLS: TemplateTool[] = [
  {
    slug: "rent-ledger-template",
    title: "家賃管理表テンプレート（Excel・無料）",
    description:
      "部屋ごとの家賃・管理費・入金状況を月次で管理できるExcelテンプレート。請求額・入金状態・合計を自動計算します。",
    file: "rent-ledger-template.xlsx",
    format: "Excel",
  },
  {
    slug: "move-out-settlement-template",
    title: "退去精算書テンプレート（Excel・無料）",
    description:
      "敷金からの控除明細と返還額を自動計算する退去精算書（敷金精算書）のExcelテンプレート。国交省ガイドライン準拠の注記つき。",
    file: "move-out-settlement-template.xlsx",
    format: "Excel",
  },
  {
    slug: "restoration-burden-template",
    title: "原状回復 負担割合表テンプレート（Excel・無料）",
    description:
      "国交省ガイドラインの耐用年数早見表と、入居年数から入居者負担額を自動按分する計算表をまとめたExcelテンプレート。",
    file: "restoration-burden-template.xlsx",
    format: "Excel",
  },
  {
    slug: "contract-renewal-notice-template",
    title: "契約更新通知テンプレート（Word・無料）",
    description:
      "賃貸借契約の更新案内を入居者へ送るためのWord文書テンプレート。契約期間・更新料・返送期日の記入欄つきで、印刷・郵送にそのまま使えます。",
    file: "contract-renewal-notice-template.docx",
    format: "Word",
  },
  {
    slug: "owner-remittance-statement-template",
    title: "オーナー送金明細書テンプレート（Excel・無料）",
    description:
      "オーナーへの月次送金額を、入金（家賃・共益費）と差引（管理手数料・修繕費）から自動計算する送金明細書のExcelテンプレート。",
    file: "owner-remittance-statement-template.xlsx",
    format: "Excel",
  },
  {
    slug: "rent-demand-letter-template",
    title: "家賃督促状テンプレート（Word・無料）",
    description:
      "家賃滞納の入居者へ送る督促状（お支払いのお願い）のWord文書テンプレート。対象月・未払い額・支払い期限の記入欄つき。初回向けの穏当な文面です。",
    file: "rent-demand-letter-template.docx",
    format: "Word",
  },
  {
    slug: "property-list-template",
    title: "物件一覧表テンプレート（Excel・無料）",
    description:
      "物件・部屋ごとに間取り・家賃・入居状況・契約期間・オーナーをまとめて管理できるExcelテンプレート。合計戸数と家賃合計を自動集計します。",
    file: "property-list-template.xlsx",
    format: "Excel",
  },
  {
    slug: "move-in-checklist-template",
    title: "入居時チェックリスト テンプレート（Excel・無料）",
    description:
      "入居時に部屋・設備の状態を場所ごとに点検し、既存の傷・汚れを記録するExcelテンプレート。退去時の原状回復トラブルを防ぐ証拠になります。",
    file: "move-in-checklist-template.xlsx",
    format: "Excel",
  },
  {
    slug: "key-receipt-template",
    title: "鍵預かり証テンプレート（Word・無料）",
    description:
      "内見・工事・退去立会いなどで鍵を預かる際に発行する鍵預かり証のWord文書テンプレート。鍵の種類・本数・返却予定日・署名欄つき。",
    file: "key-receipt-template.docx",
    format: "Word",
  },
];

export function getTemplateBySlug(slug: string): TemplateTool | undefined {
  return TEMPLATE_TOOLS.find((t) => t.slug === slug);
}

// sitemap用: /tools 配下の全slug
export function getAllToolSlugs(): string[] {
  return [
    ...CALCULATOR_TOOLS.map((t) => t.slug),
    ...TEMPLATE_TOOLS.map((t) => t.slug),
  ];
}
