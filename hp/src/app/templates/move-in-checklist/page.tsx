import type { Metadata } from "next";
import TemplatePage, { TemplateSection } from "../TemplatePage";
import { getTemplateBySlug } from "@/lib/tools";

const tool = getTemplateBySlug("move-in-checklist")!;

export const metadata: Metadata = {
  title: "入居時チェックリスト テンプレート（Excel・無料ダウンロード）",
  description:
    "入居時に部屋・設備の状態を場所ごとに点検し、既存の傷・汚れを記録する無料Excelテンプレート。退去時の原状回復トラブルを防ぐ証拠として使えます。署名欄つき。",
  alternates: { canonical: `/templates/${tool.slug}` },
  openGraph: {
    title: "入居時チェックリスト テンプレート（Excel・無料） | Roomly",
    description:
      "入居時に部屋・設備の状態を場所ごとに点検し、既存の傷・汚れを記録する無料Excelテンプレート。",
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
      lead="入居の際に、玄関・居室・水回り・設備などを場所ごとに点検し、もともとある傷・汚れ・不具合を記録するためのExcelテンプレートです。入居者と管理会社の双方で控えておけば、退去時に「もとからあった損耗」と「入居者がつけた損耗」を区別する根拠になります。署名欄つき。会員登録不要・無料です。"
      relatedColumns={[
        { href: "/column/security-deposit-dispute-starts-at-move-in", label: "敷金トラブルの9割は「入居時」に原因がある" },
        { href: "/column/move-out-inspection-procedure", label: "退去立会いの進め方" },
        { href: "/column/restoration-guideline-calculation", label: "原状回復ガイドラインの計算方法" },
      ]}
      ctaHeading="入居時の記録もRoomlyに残す"
      ctaText="入居時の写真・チェック記録から退去精算まで、部屋単位で時系列に保管。10区画まで無料。"
    >
      <TemplateSection title="なぜ入居時に記録するのか">
        <p>
          敷金や原状回復でもめる原因の多くは、退去時の交渉ではなく、入居時に部屋の状態を記録していなかったことにあります。
          退去時に傷が見つかっても、それが入居前からあったのか、入居者がつけたのかを証明する材料がなければ、話は水掛け論になります。
        </p>
        <p>
          入居の時点で双方が状態を確認し、署名して控えておく——たったこれだけで、退去時の精算は「記録に基づく事務」になり、感情的な対立になりにくくなります。
        </p>
      </TemplateSection>

      <TemplateSection title="使い方">
        <p>
          入居者の立会いのもと、場所ごとに項目を確認していきます。気になる箇所があれば「傷・汚れ等の記録」欄に具体的に書き、
          あわせて写真を撮っておきます。写真にはファイル名や撮影日が残るので、チェックリストと組み合わせると証拠力が上がります。
        </p>
        <p>
          最後に入居者・管理会社の双方が署名し、同じ内容を双方で保管します。退去時にはこのリストを基準に状態を比較します。
        </p>
      </TemplateSection>

      <TemplateSection title="記録が紙やバラバラだと起きること">
        <p>
          チェックリストを紙で保管していると、数年後の退去時に「どこにしまったか分からない」「写真が別の場所にある」という事態が起きます。
          入居時の記録は、退去という数年先のイベントで初めて効いてくるものです。部屋単位で写真ごと時系列に残しておける仕組みがあると、いざというときに確実に引き出せます。
        </p>
      </TemplateSection>
    </TemplatePage>
  );
}
