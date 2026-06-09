import type { Metadata } from "next";
import TemplatePage, { TemplateSection } from "../TemplatePage";
import { getTemplateBySlug } from "@/lib/tools";

const tool = getTemplateBySlug("move-out-settlement-template")!;

export const metadata: Metadata = {
  title: "退去精算書テンプレート（Excel・無料ダウンロード）",
  description:
    "敷金からの控除明細と返還額を自動計算する退去精算書（敷金精算書）の無料Excelテンプレート。国交省ガイドライン準拠の注記つきで、敷金トラブルを防ぐ書式です。",
  alternates: { canonical: `/tools/${tool.slug}` },
  openGraph: {
    title: "退去精算書テンプレート（Excel・無料） | Roomly",
    description:
      "敷金からの控除明細と返還額を自動計算する退去精算書（敷金精算書）の無料Excelテンプレート。国交省ガイドライン準拠。",
    type: "website",
    url: `https://hp.roomly.jp/tools/${tool.slug}`,
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <TemplatePage
      tool={tool}
      lead="退去時に預り敷金から原状回復費用などを控除し、返還額を入居者へ提示するための退去精算書（敷金精算書）のExcelテンプレートです。控除合計と返還額は自動計算。国土交通省ガイドラインに沿った注記つきで、敷金トラブルを防ぐ書式になっています。会員登録不要・無料です。"
      relatedColumns={[
        { href: "/column/move-out-settlement-template", label: "退去精算書の作り方と渡し方" },
        { href: "/column/security-deposit-dispute-starts-at-move-in", label: "敷金トラブルの9割は「入居時」に原因がある" },
        { href: "/column/restoration-guideline-calculation", label: "原状回復ガイドラインの計算方法" },
      ]}
      ctaHeading="退去精算もRoomlyで一元管理"
      ctaText="入居時の写真・チェックシートから退去精算まで物件単位で記録。10区画まで無料。"
    >
      <TemplateSection title="このテンプレートの構成">
        <p>
          物件・入居者情報、預り敷金、控除明細（項目・金額・負担割合・備考）、控除合計、返還額の順で構成されています。
          控除合計は明細から自動集計され、返還額は「預り敷金 − 控除合計」で自動計算されます。
        </p>
        <p>
          控除明細には負担割合の列を設けてあります。耐用年数による按分で入居者負担が一部になる項目は、ここに割合を記載しておくと、
          後から「なぜこの金額なのか」を説明しやすくなります。
        </p>
      </TemplateSection>

      <TemplateSection title="敷金精算でトラブルを避けるポイント">
        <p>
          通常損耗・経年変化は大家負担です。家賃にあらかじめ減価分が含まれているという考え方が根拠で、入居者に請求できるのは
          故意・過失による損耗に限られます。テンプレート下部にこの注記を入れてあるのは、精算書そのものに根拠を残しておくためです。
        </p>
        <p>
          精算でもめる原因の多くは、退去時の交渉力ではなく、入居時に部屋の状態を記録していなかったことにあります。
          入居前の写真があれば「もともとあった傷」と「入居者がつけた傷」を区別でき、精算書の説得力が変わります。
        </p>
      </TemplateSection>

      <TemplateSection title="退去精算書を渡すタイミング">
        <p>
          退去立会いの場で口頭だけで済ませると、後日「言った・言わない」になりがちです。立会い後すみやかに金額の根拠を添えた精算書を渡し、
          返還額（または不足請求額）と振込時期を明記しておくと、その後のやり取りが減ります。
        </p>
      </TemplateSection>
    </TemplatePage>
  );
}
