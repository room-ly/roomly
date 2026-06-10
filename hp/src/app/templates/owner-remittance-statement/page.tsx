import type { Metadata } from "next";
import TemplatePage, { TemplateSection } from "../TemplatePage";
import { getTemplateBySlug } from "@/lib/tools";

const tool = getTemplateBySlug("owner-remittance-statement")!;

export const metadata: Metadata = {
  title: "オーナー送金明細書テンプレート（Excel・無料ダウンロード）",
  description:
    "オーナーへの月次送金額を、家賃などの入金と管理手数料・修繕費などの差引から自動計算する送金明細書の無料Excelテンプレート。賃貸管理会社の月次精算にそのまま使えます。",
  alternates: { canonical: `/templates/${tool.slug}` },
  openGraph: {
    title: "オーナー送金明細書テンプレート（Excel・無料） | Roomly",
    description:
      "オーナーへの月次送金額を入金と差引から自動計算する送金明細書の無料Excelテンプレート。",
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
      lead="管理物件のオーナーへ毎月の収支を報告し、送金額を提示するための送金明細書のExcelテンプレートです。入金（家賃・共益費など）と差引（管理手数料・修繕費など）をそれぞれ集計し、お振込金額を自動計算します。会員登録不要・無料でダウンロードできます。"
      relatedColumns={[
        { href: "/column/owner-remittance-statement-template", label: "オーナー送金明細書に何を載せるべきか" },
        { href: "/column/owner-remittance-automation", label: "オーナー送金の自動化で何が変わるか" },
        { href: "/column/distant-management-loyal-owners", label: "遠方オーナーほど明細の丁寧さが効く理由" },
      ]}
      ctaHeading="オーナー送金もRoomlyで自動化"
      ctaText="家賃入金から管理手数料の差引まで自動集計し、送金明細をワンクリックで発行。10区画まで無料。"
    >
      <TemplateSection title="このテンプレートの構成">
        <p>
          上段に入金項目（家賃・共益費・駐車場代など）、中段に差引項目（管理手数料・修繕費・広告費など）、
          下段にお振込金額を配置しています。入金合計・差引合計はそれぞれ自動集計され、お振込金額は「入金合計 − 差引合計」で自動計算されます。
        </p>
        <p>
          各項目に備考欄を設けてあります。修繕費がかかった月は内容を書き添えておくと、オーナーからの問い合わせを減らせます。
        </p>
      </TemplateSection>

      <TemplateSection title="明細でオーナーの信頼を得るポイント">
        <p>
          送金額だけを伝える明細は、金額が前月と違ったときに必ず問い合わせを生みます。何が入って何が引かれたのかを項目で見せておけば、
          オーナーは自分で理解でき、管理会社への信頼につながります。とくに遠方のオーナーほど、明細の丁寧さが管理替えを防ぐ要素になります。
        </p>
        <p>
          管理手数料は消費税の扱いを明確にし、すべて税込で記載するのが基本です。修繕費は見積書・領収書と金額を一致させ、立替えがある場合は精算のタイミングも明記しておくと安全です。
        </p>
      </TemplateSection>

      <TemplateSection title="手作業で送金明細を作る限界">
        <p>
          管理棟数が増えると、毎月オーナーごとに入金を確認し、手数料を計算し、修繕費を拾って明細を作る作業が積み上がります。
          数字の転記ミスは送金額の誤りに直結し、信頼を一度で損ないます。入金消込と連動した明細の自動発行に切り替えると、この月次作業そのものがなくなります。
        </p>
      </TemplateSection>
    </TemplatePage>
  );
}
