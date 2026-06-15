import type { Metadata } from "next";
import TemplatePage, { TemplateSection } from "../TemplatePage";
import { getTemplateBySlug } from "@/lib/tools";

const tool = getTemplateBySlug("contract-renewal-notice")!;

export const metadata: Metadata = {
  title: "契約更新通知テンプレート（Word・無料ダウンロード）",
  description:
    "賃貸借契約の更新案内を入居者へ送るための無料Wordテンプレート。契約期間・更新後の家賃・更新料・返送期日の記入欄つきで、印刷・郵送にそのまま使えます。",
  alternates: { canonical: `/templates/${tool.slug}` },
  openGraph: {
    title: "契約更新通知テンプレート（Word・無料） | Roomly",
    description:
      "賃貸借契約の更新案内を入居者へ送るための無料Wordテンプレート。契約期間・更新料・返送期日の記入欄つき。",
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
      lead="賃貸借契約の更新時期が近づいた入居者へ送る「更新のご案内」のWord文書テンプレートです。契約期間・更新後の家賃・更新料・更新事務手数料・返送期日の記入欄を備え、印刷してそのまま郵送できます。会員登録不要・無料でダウンロードできます。"
      relatedColumns={[
        { href: "/column/contract-renewal-workflow", label: "契約更新の事務フローを取りこぼさない仕組み" },
        { href: "/column/renewal-fee-regional-difference", label: "更新料の相場と地域差" },
        { href: "/column/rental-contract-template", label: "賃貸借契約書テンプレートの使い方" },
      ]}
      ctaHeading="更新管理の抜け漏れをRoomlyで防ぐ"
      ctaText="契約満了日から逆算して更新案内のタイミングを自動でリマインド。10区画まで無料。"
      autoOutput="Roomlyなら、契約内容と新しい更新条件を反映した契約更新通知書を、"
    >
      <TemplateSection title="記入する項目">
        <p>
          物件名・部屋番号、現在の契約期間、新しい契約期間、更新後の家賃（税込）、更新料（税込）、更新事務手数料（税込）、返送期日を埋めて使います。
          金額はすべて税込で記載する欄にしてあります。
        </p>
        <p>
          末尾には管理会社名・担当者・連絡先の記入欄があります。問い合わせ先を明記しておくと、入居者からの確認連絡がスムーズになります。
        </p>
      </TemplateSection>

      <TemplateSection title="いつ送るか">
        <p>
          更新案内は契約満了の2〜3か月前に送るのが一般的です。早すぎると入居者が忘れ、遅すぎると返送・押印・再契約の事務が満了日に間に合いません。
          満了日から逆算して送付日を決めておくと、毎月発生する更新事務を平準化できます。
        </p>
        <p>
          更新を希望しない（退去する）場合の意思表示期限も、契約書の解約予告期間と合わせて案内に含めておくと、退去の連絡漏れを防げます。
        </p>
      </TemplateSection>

      <TemplateSection title="更新事務でつまずきやすい点">
        <p>
          戸数が増えるほど「どの部屋がいつ更新か」を一覧で把握するのが難しくなります。満了日がばらばらに分布するため、表計算で管理していると
          送付タイミングを月初にまとめてチェックする運用が必要になり、チェックを忘れた月に取りこぼしが生まれます。
        </p>
      </TemplateSection>
    </TemplatePage>
  );
}
