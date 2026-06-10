import type { Metadata } from "next";
import TemplatePage, { TemplateSection } from "../TemplatePage";
import { getTemplateBySlug } from "@/lib/tools";

const tool = getTemplateBySlug("key-receipt-template")!;

export const metadata: Metadata = {
  title: "鍵預かり証テンプレート（Word・無料ダウンロード）",
  description:
    "内見・工事・退去立会いなどで鍵を預かる際に発行する鍵預かり証の無料Wordテンプレート。鍵の種類・本数・お預かり日・返却予定日・署名欄つきで、そのまま印刷して使えます。",
  alternates: { canonical: `/tools/${tool.slug}` },
  openGraph: {
    title: "鍵預かり証テンプレート（Word・無料） | Roomly",
    description:
      "内見・工事・退去立会いなどで鍵を預かる際に発行する鍵預かり証の無料Wordテンプレート。",
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
      lead="内見・工事・修繕・退去立会いなどで、オーナーや入居者から鍵を預かる際に発行する鍵預かり証のWord文書テンプレートです。物件名・鍵の種類・本数・お預かり日・返却予定日・目的・署名欄を備え、印刷してそのまま使えます。会員登録不要・無料です。"
      relatedColumns={[
        { href: "/column/key-management-handover", label: "鍵の引き渡し・管理でトラブルを防ぐ" },
        { href: "/column/key-replacement-cost-burden", label: "鍵交換費用は誰が負担するのか" },
        { href: "/column/move-out-inspection-procedure", label: "退去立会いの進め方" },
      ]}
      ctaHeading="鍵の所在もRoomlyで把握"
      ctaText="どの部屋の鍵を、いつ・誰が・何の目的で預かっているかを記録。返却漏れを防ぎます。10区画まで無料。"
    >
      <TemplateSection title="鍵預かり証を発行する場面">
        <p>
          鍵を預かる場面は意外と多くあります。空室の内見対応、リフォームや修繕の業者対応、退去立会い、オーナーからのスペアキー受け取り——
          こうしたやり取りで「誰が・いつ・何本」預かったかを書面に残しておくと、紛失や返却忘れのときに責任の所在がはっきりします。
        </p>
        <p>
          口頭だけで鍵を受け渡すと、本数の認識違いや「返した・返していない」のトラブルが起きます。預かり証は、そのリスクを一枚で消すための書類です。
        </p>
      </TemplateSection>

      <TemplateSection title="記入する項目">
        <p>
          物件名・部屋番号、鍵の種類（玄関・メールボックスなど）、本数、お預かり日、返却予定日、預かりの目的を記入します。
          鍵の種類と本数は具体的に書くほどトラブルを防げます。返却予定日を明記しておくと、返却忘れの抑止にもなります。
        </p>
      </TemplateSection>

      <TemplateSection title="鍵の管理が属人的になる前に">
        <p>
          預かり証は1件ずつのやり取りには有効ですが、件数が増えると「今どの鍵を誰が持っているか」を紙の束から探すのが難しくなります。
          鍵の所在を部屋単位で記録し、返却予定日が来たら気づける状態にしておくと、預かりっぱなしの鍵がなくなります。
        </p>
      </TemplateSection>
    </TemplatePage>
  );
}
