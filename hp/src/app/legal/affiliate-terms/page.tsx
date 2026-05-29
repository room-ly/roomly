import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "アフィリエイト利用規約",
  description:
    "Roomlyアフィリエイトプログラムの利用規約です。報酬体系・支払い条件・禁止事項を定めています。",
  alternates: { canonical: "/legal/affiliate-terms" },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-10">
    <h2 className="text-[18px] font-medium text-rm-primary">{title}</h2>
    <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-rm-text-secondary">
      {children}
    </div>
  </section>
);

export default function AffiliateTermsPage() {
  return (
    <section className="px-7 pt-20 pb-24 sm:pt-28">
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow">Legal</span>
        <h1 className="mt-6 text-[clamp(28px,4vw,42px)] font-medium leading-tight tracking-tight text-rm-primary">
          アフィリエイト利用規約
        </h1>
        <p className="mt-4 text-[14px] text-rm-text-muted">
          最終更新日: 2026年5月29日
        </p>

        <Section title="1. 適用範囲">
          <p>
            本規約は、zh（以下「当方」）が提供するRoomlyアフィリエイトプログラム（以下「本プログラム」）の利用条件を定めるものです。
            本プログラムに申し込まれた方（以下「アフィリエイター」）は、本規約に同意したものとみなします。
          </p>
        </Section>

        <Section title="2. 参加資格">
          <ul className="list-disc list-inside space-y-1">
            <li>18歳以上の個人または法人であること</li>
            <li>当方が定める審査を通過していること</li>
            <li>反社会的勢力に該当しないこと</li>
            <li>過去に当方からアカウント停止処分を受けていないこと</li>
          </ul>
        </Section>

        <Section title="3. 報酬体系">
          <p>
            紹介された会社が当方のRoomlyサービスにおいて有料プランへ移行した月から、24ヶ月間にわたり、当該会社が支払う月額利用料（税込）の20%を継続的にアフィリエイターへ還元します。
          </p>
          <p>
            ただし、当方とアフィリエイターとの個別契約により、上記とは異なる報酬体系を設定する場合があります。
          </p>
          <p>
            初回成果報酬は設定しておりません。
          </p>
        </Section>

        <Section title="4. 計測方法">
          <p>
            紹介リンク経由でRoomlyのウェブサイトを訪問されたユーザーが、90日以内にRoomlyへ会員登録し有料プランに移行した場合に成果として計上します。
          </p>
          <p>
            同一ユーザーが複数のアフィリエイトリンクを経由した場合は、最終クリックを優先します。
          </p>
        </Section>

        <Section title="5. 支払い">
          <ul className="list-disc list-inside space-y-1">
            <li>毎月末日締め、翌月25日に登録口座へ振込</li>
            <li>振込最低額: ¥3,000（税込）。未達分は翌月以降に繰越</li>
            <li>振込手数料は当方負担</li>
            <li>インボイス未登録の場合、消費税相当分は別途控除されます</li>
          </ul>
        </Section>

        <Section title="6. 禁止事項">
          <ul className="list-disc list-inside space-y-1">
            <li>自己または親族・知人の名義による自己紹介</li>
            <li>虚偽・誇大な広告表現</li>
            <li>スパム的なメール・SNS送信</li>
            <li>Roomlyブランドや商標を毀損する表現</li>
            <li>競合他社のサービスとして虚偽の比較を行うこと</li>
            <li>リスティング広告における当方の商標名（「Roomly」等）の使用</li>
            <li>第三者のCookieを上書きする手法による不正な計測</li>
            <li>法令違反・公序良俗違反の行為</li>
          </ul>
        </Section>

        <Section title="7. 報酬の取消">
          <p>
            以下の場合、当該成果に対する報酬は取り消されます:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>紹介された会社が支払いを取り消した場合（チャージバック等）</li>
            <li>本規約違反の不正行為が発覚した場合</li>
            <li>紹介された会社が登録から30日以内に解約した場合</li>
          </ul>
        </Section>

        <Section title="8. プログラムの変更・終了">
          <p>
            当方は、報酬体系・支払い条件・本規約その他の内容を、事前通知のうえ変更することがあります。
            また、相当な理由がある場合、本プログラムを終了することがあります。
            プログラム終了時点で確定している報酬は、引き続き支払われます。
          </p>
        </Section>

        <Section title="9. 免責">
          <p>
            当方は、本プログラムの利用に伴い発生した直接的・間接的損害について、当方に故意または重大な過失がある場合を除き、責任を負いません。
          </p>
        </Section>

        <Section title="10. 準拠法・管轄">
          <p>
            本規約は日本法に準拠し、本プログラムに関する紛争は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </Section>
      </div>
    </section>
  );
}
