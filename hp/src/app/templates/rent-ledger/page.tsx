import type { Metadata } from "next";
import TemplatePage, { TemplateSection } from "../TemplatePage";
import { getTemplateBySlug } from "@/lib/tools";

const tool = getTemplateBySlug("rent-ledger")!;

export const metadata: Metadata = {
  title: "家賃管理表テンプレート（Excel・無料ダウンロード）",
  description:
    "部屋ごとの家賃・管理費・入金状況を月次で管理できる無料Excelテンプレート。請求額・入金状態・合計を自動計算。賃貸の家賃管理表・物件管理表としてそのまま使えます。",
  alternates: { canonical: `/templates/${tool.slug}` },
  openGraph: {
    title: "家賃管理表テンプレート（Excel・無料） | Roomly",
    description:
      "部屋ごとの家賃・管理費・入金状況を月次で管理できる無料Excelテンプレート。請求額・入金状態・合計を自動計算します。",
    type: "website",
    url: `https://hp.roomly.jp/templates/${tool.slug}`,
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <TemplatePage
      tool={tool}
      lead="部屋ごとの家賃・管理費・入金状況を月次で記録できるExcelテンプレートです。請求額（家賃＋管理費）、入金状態（入金済／一部入金／未入金）、月の合計を自動計算します。会員登録不要・無料でダウンロードできます。"
      relatedColumns={[
        { href: "/column/property-management-excel-template", label: "物件管理をExcelで回す限界はどこか" },
        { href: "/column/excel-property-management-limit", label: "賃貸管理がExcelで破綻する瞬間" },
        { href: "/column/rent-reconciliation-efficiency", label: "家賃の消し込みを速くする手順" },
      ]}
      ctaHeading="家賃管理をExcelから卒業する"
      ctaText="入金消込・滞納アラート・督促履歴まで物件単位で自動化。10区画まで無料です。"
    >
      <TemplateSection title="このテンプレートでできること">
        <p>
          入力するのは部屋番号・入居者名・家賃・管理費・入金日・入金額だけ。請求額は家賃と管理費から自動で算出され、
          入金額が請求額に達していれば「入金済」、不足していれば「一部入金」、未入力なら「未入金」と状態が自動表示されます。
        </p>
        <p>
          ヘッダー行は固定表示されるので、行数が増えても項目を見失いません。最下部に当月の請求合計・入金合計が出るため、
          月末の入金率がひと目で分かります。
        </p>
      </TemplateSection>

      <TemplateSection title="使い方">
        <p>
          対象月を記入し、各部屋の家賃・管理費を入力します。家賃は基本的に毎月同じなので、初月に入力したら翌月以降はコピーで構いません。
          入金が確認できたら入金日と入金額を入れていくだけです。
        </p>
        <p>
          1棟（最大20室）を1シートで管理する想定です。複数棟を扱う場合はシートを複製し、棟ごとに分けると見やすくなります。
        </p>
      </TemplateSection>

      <TemplateSection title="Excel管理が向かなくなるサイン">
        <p>
          管理戸数が増えると、Excelは「誰がどこまで払ったか」を一覧では追えても、「いつ・誰に・どんな督促をしたか」までは記録しきれません。
          滞納が複数の部屋で同時に走り始めると、督促のタイミングを表計算の外（記憶やメモ）に置くことになり、抜けが生まれます。
        </p>
        <p>
          目安として、滞納対応が月に数件を超えて常態化してきたら、入金消込と督促履歴が一体になった仕組みへの切り替えを検討する価値があります。
        </p>
      </TemplateSection>
    </TemplatePage>
  );
}
