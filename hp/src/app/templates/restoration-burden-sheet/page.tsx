import type { Metadata } from "next";
import TemplatePage, { TemplateSection } from "../TemplatePage";
import { getTemplateBySlug } from "@/lib/tools";

const tool = getTemplateBySlug("restoration-burden-sheet")!;

export const metadata: Metadata = {
  title: "原状回復 負担割合表テンプレート（Excel・無料ダウンロード）",
  description:
    "国交省ガイドラインの耐用年数早見表と、入居年数から入居者負担額を自動按分する計算表をまとめた無料Excelテンプレート。退去時の原状回復費用の負担割合を明確にできます。",
  alternates: { canonical: `/templates/${tool.slug}` },
  openGraph: {
    title: "原状回復 負担割合表テンプレート（Excel・無料） | Roomly",
    description:
      "国交省ガイドラインの耐用年数早見表と、入居年数から入居者負担額を自動按分する計算表をまとめた無料Excelテンプレート。",
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
      lead="退去時の原状回復費用を、大家と入居者でどう分担するかを整理するためのExcelテンプレートです。国土交通省ガイドラインの耐用年数早見表と、補修費用・入居年数から入居者負担額を自動按分する計算表の2シート構成。会員登録不要・無料でダウンロードできます。"
      relatedColumns={[
        { href: "/column/restoration-guideline-calculation", label: "原状回復ガイドラインの計算方法 — 耐用年数と按分のリアル" },
        { href: "/column/restoration-word-creates-disputes", label: "「原状回復」という言葉自体が揉め事を生む" },
        { href: "/column/move-out-inspection-procedure", label: "退去立会いの進め方" },
      ]}
      ctaHeading="原状回復の記録もRoomlyで"
      ctaText="入居時の写真・チェックシートから退去精算まで物件単位で記録。10区画まで無料。"
    >
      <TemplateSection title="2つのシートの使い分け">
        <p>
          1枚目の「耐用年数早見表」は、壁紙6年・流し台5年・設備15年といった国交省ガイドラインの耐用年数をまとめたものです。
          補修対象がどの区分にあたるかを確認するために使います。
        </p>
        <p>
          2枚目の「負担割合 計算表」に、対象・補修費用・耐用年数・入居年数を入力すると、残存価値を考慮した入居者負担率と負担額が自動計算されます。
          複数項目をまとめて入力すれば、入居者負担・大家負担の合計も出ます。
        </p>
      </TemplateSection>

      <TemplateSection title="按分の考え方">
        <p>
          原状回復費用は「補修費の全額を入居者が払う」わけではありません。たとえば壁紙は耐用年数6年で残存価値1円まで按分されるため、
          入居3年で退去した場合の入居者負担は補修費の50%、6年を超えればほぼ1円になります。家賃に減価分が含まれているという考え方が根拠です。
        </p>
        <p>
          畳表やフローリングの部分補修のように、経過年数を考慮しない区分もあります。早見表の備考欄で区分を確認してから計算表に入力してください。
        </p>
      </TemplateSection>

      <TemplateSection title="入居者負担になるケース・ならないケース">
        <p>
          入居者負担になるのは、故意・過失による損耗です。タバコのヤニ、飲み物のシミ、引越し時の傷、結露を放置して生じたカビなどが該当します。
          一方、家具の設置跡、日焼けによる変色、通常の使用で生じた摩耗は通常損耗・経年変化として大家負担になります。
        </p>
      </TemplateSection>
    </TemplatePage>
  );
}
