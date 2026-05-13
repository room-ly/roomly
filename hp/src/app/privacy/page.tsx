import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "Roomlyのプライバシーポリシー。個人情報の取り扱いについて定めています。",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <section className="px-7 pt-20 pb-24 sm:pt-28">
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow">Privacy Policy</span>
        <h1 className="mt-6 text-[clamp(28px,4vw,42px)] font-medium leading-tight tracking-tight text-rm-primary">
          プライバシーポリシー
        </h1>
        <p className="mt-4 text-[14px] text-rm-text-muted">最終更新日: 2026年5月11日</p>

        <div className="prose-rm mt-10">
          <p>zh（以下「当方」）は、Roomly（以下「本サービス」）の運営において、利用者の個人情報の保護を重要と考え、以下のとおりプライバシーポリシーを定めます。</p>

          <h2>1. 収集する情報</h2>
          <p>本サービスでは、以下の情報を収集することがあります。</p>
          <ul>
            <li>氏名、メールアドレス、電話番号、会社名（アカウント登録・お問い合わせ時）</li>
            <li>物件・入居者・契約・家賃・修繕・送金等の業務データ（サービス利用時）</li>
            <li>操作ログ・利用履歴（機能の利用状況・操作パターン等）</li>
            <li>アクセスログ、IPアドレス、ブラウザ情報、Cookie情報（サイト閲覧時）</li>
          </ul>

          <h2>2. 利用目的</h2>
          <p>収集した情報は、以下の目的で利用します。</p>
          <ul>
            <li>本サービスの提供・運用・改善</li>
            <li>利用者へのサポート対応</li>
            <li>利用状況の分析・統計（個人を特定しない形で）</li>
            <li>業務データの統計的分析・AI分析による付加価値機能の提供（投資対効果分析、市場動向レポート等）</li>
            <li>個人・企業を特定できない形に匿名化・統計化したうえでの、データ分析サービス・API・レポートの提供</li>
            <li>重要なお知らせ・サービスに関する通知</li>
          </ul>

          <h2>3. 第三者提供</h2>
          <p>当方は、以下の場合を除き、利用者の個人情報を第三者に提供しません。</p>
          <ul>
            <li>利用者の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命・身体・財産の保護のために必要な場合</li>
          </ul>

          <h2>4. 外部サービスの利用</h2>
          <p>本サービスでは、以下の外部サービスを利用しています。各サービスのプライバシーポリシーもあわせてご確認ください。</p>
          <ul>
            <li><strong>Google Analytics</strong> — アクセス解析のために利用。Cookieを使用してデータを収集しますが、個人を特定する情報は含みません。</li>
            <li><strong>Supabase</strong> — データベース・認証基盤として利用。データはSSL/TLSで暗号化して送受信されます。</li>
            <li><strong>Vercel</strong> — ウェブサイトのホスティングに利用。</li>
          </ul>

          <h2>5. データの安全管理</h2>
          <p>当方は、個人情報の漏洩・紛失・毀損を防止するため、以下の措置を講じています。</p>
          <ul>
            <li>通信の暗号化（SSL/TLS）</li>
            <li>データベースのRow Level Security（RLS）による管理会社ごとのデータ分離</li>
            <li>定期的なバックアップ</li>
          </ul>

          <h2>6. 利用者の権利</h2>
          <p>利用者は、当方が保有する自己の個人情報について、開示・訂正・削除を請求できます。お問い合わせフォームよりご連絡ください。</p>

          <h2>7. ポリシーの変更</h2>
          <p>本ポリシーは、法令の改正やサービス内容の変更に伴い、事前の通知なく変更することがあります。変更後のポリシーは本ページに掲載した時点で効力を生じます。</p>

          <h2>8. お問い合わせ</h2>
          <p>個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。</p>
          <ul>
            <li>事業者名: zh</li>
            <li>メール: お問い合わせフォームよりご連絡ください</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
