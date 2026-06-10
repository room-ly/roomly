import type { Metadata } from "next";
import TemplatePage, { TemplateSection } from "../TemplatePage";
import { getTemplateBySlug } from "@/lib/tools";

const tool = getTemplateBySlug("rent-demand-letter")!;

export const metadata: Metadata = {
  title: "家賃督促状テンプレート（Word・無料ダウンロード）",
  description:
    "家賃滞納の入居者へ送る督促状（お支払いのお願い）の無料Wordテンプレート。対象月・未払い額・支払い期限の記入欄つき。初回向けの穏当な文面で、そのまま印刷・郵送できます。",
  alternates: { canonical: `/templates/${tool.slug}` },
  openGraph: {
    title: "家賃督促状テンプレート（Word・無料） | Roomly",
    description:
      "家賃滞納の入居者へ送る督促状（お支払いのお願い）の無料Wordテンプレート。初回向けの穏当な文面。",
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
      lead="家賃の支払いが確認できない入居者へ送る督促状（お支払いのお願い）のWord文書テンプレートです。対象月・未払い額（税込）・支払い期限・振込先の記入欄を備え、印刷してそのまま郵送できます。初回の連絡に向いた、相手を追い詰めすぎない文面にしてあります。会員登録不要・無料です。"
      relatedColumns={[
        { href: "/column/rent-delinquency-initial-response", label: "家賃滞納の初動で差がつく対応" },
        { href: "/column/rent-demand-letter-template", label: "督促状の文面はどこまで書くべきか" },
        { href: "/column/rent-guarantee-company-guide", label: "家賃保証会社の使いどころ" },
      ]}
      ctaHeading="滞納対応の履歴をRoomlyで残す"
      ctaText="入金消込・滞納アラート・督促履歴を入居者ごとに記録。いつ何を送ったかが残ります。10区画まで無料。"
    >
      <TemplateSection title="このテンプレートの使いどころ">
        <p>
          このテンプレートは、滞納が確認できた直後に送る「最初の1通」を想定しています。いきなり強い言葉で迫ると、払う意思のある入居者との関係まで壊しかねません。
          文面は「お支払いのお願い」とし、行き違いで入金済みの場合への配慮文も入れてあります。
        </p>
        <p>
          記入するのは物件名・部屋番号、未払いの対象月、未払い額（税込）、支払い期限、振込先です。期限と振込先を具体的に書くことが、入金までの時間を縮めます。
        </p>
      </TemplateSection>

      <TemplateSection title="滞納対応は「初動の速さ」と「記録」">
        <p>
          滞納は時間が経つほど回収が難しくなります。支払日の翌日〜数日で軽い確認、それでも入金がなければこの督促状、という段階を決めておくと、対応が感情ではなく手順で進みます。
        </p>
        <p>
          同じくらい大事なのが記録です。いつ・誰に・どの方法で督促したかが残っていないと、保証会社への請求や、最終的な法的手続きに進む際に「催告した事実」を示せません。
          督促状を送った日付・方法は必ず控えておきます。
        </p>
      </TemplateSection>

      <TemplateSection title="この先の段階に進む前に">
        <p>
          このお願いベースの督促で反応がない場合、次は支払い期限を明記した催告書、連帯保証人・保証会社への連絡、内容証明郵便へと段階が上がっていきます。
          いきなり最終手段に飛ばず、段階を踏んだ記録を残しておくことが、後の手続きを有利にします。
        </p>
      </TemplateSection>
    </TemplatePage>
  );
}
