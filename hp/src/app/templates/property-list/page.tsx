import type { Metadata } from "next";
import TemplatePage, { TemplateSection } from "../TemplatePage";
import { getTemplateBySlug } from "@/lib/tools";

const tool = getTemplateBySlug("property-list")!;

export const metadata: Metadata = {
  title: "物件一覧表テンプレート（Excel・無料ダウンロード）",
  description:
    "物件・部屋ごとに間取り・家賃・入居状況・契約期間・オーナーをまとめて管理できる無料Excelテンプレート。合計戸数と家賃合計を自動集計。賃貸の物件管理にそのまま使えます。",
  alternates: { canonical: `/templates/${tool.slug}` },
  openGraph: {
    title: "物件一覧表テンプレート（Excel・無料） | Roomly",
    description:
      "物件・部屋ごとに間取り・家賃・入居状況・契約期間・オーナーをまとめて管理できる無料Excelテンプレート。",
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
      lead="管理している物件・部屋を一覧で把握するためのExcelテンプレートです。物件名・部屋番号・間取り・面積・家賃・入居状況・契約期間・オーナー名をまとめて管理でき、合計戸数と家賃合計を自動集計します。先頭行と先頭列は固定表示されるので、件数が増えても見やすいままです。会員登録不要・無料です。"
      relatedColumns={[
        { href: "/column/property-management-excel-template", label: "物件管理をExcelで回す限界はどこか" },
        { href: "/column/excel-property-management-limit", label: "賃貸管理がExcelで破綻する瞬間" },
        { href: "/column/rent-management-system-comparison", label: "賃貸管理システムは何で選ぶか" },
      ]}
      ctaHeading="物件台帳をRoomlyで一元化"
      ctaText="物件・部屋・契約・入金を1つのデータベースで管理。空室状況も自動で反映。10区画まで無料。"
    >
      <TemplateSection title="家賃管理表との使い分け">
        <p>
          家賃管理表が「毎月の入金を追う」ための表なのに対し、物件一覧表は「どんな物件をいくつ持っていて、今どういう状態か」を俯瞰するための台帳です。
          空室がどこか、どの契約がいつ満了するか、どのオーナーの物件か——この全体像を1枚で持っておくと、月次の管理がぶれません。
        </p>
        <p>
          契約満了の列を埋めておけば、更新案内を出すべき部屋を月初に拾えます。空室の列を見れば、客付けに動くべき部屋がすぐ分かります。
        </p>
      </TemplateSection>

      <TemplateSection title="入力のコツ">
        <p>
          状態の列は「入居中／空室／募集中／停止」など、自分のルールで言葉を統一しておくと、後で並べ替えやフィルタがしやすくなります。
          1棟が複数室ある場合は、物件名を各行に繰り返し入れておくと、棟ごとの集計や絞り込みが効きます。
        </p>
      </TemplateSection>

      <TemplateSection title="一覧表で管理しきれなくなったら">
        <p>
          一覧表は全体像の把握には強い一方、契約書・入金履歴・修繕記録・オーナーへの送金といった「その物件にぶら下がる情報」までは持てません。
          物件をクリックすれば関連情報が全部出てくる状態が必要になったら、台帳をデータベース型の仕組みへ移すタイミングです。
        </p>
      </TemplateSection>
    </TemplatePage>
  );
}
