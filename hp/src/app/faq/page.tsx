import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "よくある質問（FAQ）",
  description:
    "Roomlyに関するよくある質問と回答。料金・機能・セキュリティ・導入方法などについて回答しています。",
};

const faqCategories = [
  {
    category: "サービスについて",
    questions: [
      {
        q: "Roomlyはどんなサービスですか？",
        a: "Roomlyは賃貸管理会社向けの業務管理SaaSです。物件・入居者・契約・家賃・修繕・オーナー送金など、賃貸管理に必要な機能をひとつの画面で一元管理できます。",
      },
      {
        q: "どんな規模の管理会社が対象ですか？",
        a: "小規模（数戸）から中規模（数百戸）の管理会社を主な対象としています。10区画までは無料でお使いいただけるので、個人のオーナー様や小規模管理会社でもお気軽にお試しください。",
      },
      {
        q: "パソコンが苦手でも使えますか？",
        a: "はい。シンプルで直感的な画面設計を心がけています。不明点があればメールサポートでお気軽にご相談いただけます。",
      },
      {
        q: "スマートフォンからも使えますか？",
        a: "はい。ブラウザベースのサービスなので、スマートフォンやタブレットからもアクセスできます。レスポンシブ対応済みです。",
      },
    ],
  },
  {
    category: "料金について",
    questions: [
      {
        q: "無料プランに期限はありますか？",
        a: "いいえ。10区画以内であれば、期限なくずっと無料でお使いいただけます。機能制限もありません。",
      },
      {
        q: "有料プランの料金はいくらですか？",
        a: "11〜50区画で月額¥5,000（税込）、51〜100区画で月額¥10,000（税込）です。101区画以上は個別にお見積りいたします。全プランで全機能が利用可能です。",
      },
      {
        q: "初期費用はかかりますか？",
        a: "いいえ。初期費用は一切かかりません。",
      },
      {
        q: "解約時の違約金はありますか？",
        a: "ありません。いつでも解約でき、違約金は一切発生しません。",
      },
      {
        q: "支払い方法は？",
        a: "クレジットカード（Visa / Mastercard / JCB）に対応予定です。無料プランではカード登録不要です。",
      },
    ],
  },
  {
    category: "機能について",
    questions: [
      {
        q: "どんな機能がありますか？",
        a: "物件管理・入居者管理・契約管理・家賃管理（請求・入金・滞納追跡）・修繕管理・オーナー送金・ダッシュボード・CSV/PDFエクスポート・通知機能・権限管理（RBAC）など、賃貸管理に必要な機能をひと通り備えています。",
      },
      {
        q: "CSVで物件データをインポートできますか？",
        a: "CSVインポート機能は今後の対応予定です。現在はCSVエクスポート（物件・入居者・家賃データ）に対応しています。",
      },
      {
        q: "オーナーへの月次報告書は自動で作れますか？",
        a: "はい。オーナー送金機能で月次の精算明細PDFを自動生成できます。家賃収入・管理手数料・経費を自動計算し、送金額を算出します。",
      },
      {
        q: "複数のスタッフでアカウントを共有できますか？",
        a: "はい。管理者・マネージャー・スタッフ・閲覧者の4つの権限レベルで、スタッフごとに操作範囲を制御できます。",
      },
    ],
  },
  {
    category: "セキュリティについて",
    questions: [
      {
        q: "データのセキュリティは大丈夫ですか？",
        a: "はい。通信はSSL/TLSで暗号化され、データベースはRow Level Security（RLS）で管理会社ごとに完全分離されています。他社のデータにアクセスすることはできません。",
      },
      {
        q: "データのバックアップは取られていますか？",
        a: "はい。自動バックアップを行っています。万が一の際もデータの復旧が可能です。",
      },
      {
        q: "個人情報の取り扱いはどうなっていますか？",
        a: "個人情報保護法に準拠し、適切に管理しています。詳しくはプライバシーポリシーをご確認ください。",
      },
    ],
  },
  {
    category: "導入・サポートについて",
    questions: [
      {
        q: "導入にどのくらい時間がかかりますか？",
        a: "アカウント登録から利用開始まで最短5分です。物件データの入力は、管理戸数によりますが、数十戸であれば1〜2時間程度で完了します。",
      },
      {
        q: "既存のシステムからの移行サポートはありますか？",
        a: "CSVインポート機能（今後対応予定）やメールサポートで移行をお手伝いします。大規模な移行については個別にご相談ください。",
      },
      {
        q: "サポートの対応時間は？",
        a: "メールサポートは平日10:00〜18:00に対応しています。お問い合わせから原則1営業日以内に返信いたします。",
      },
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCategories.flatMap((cat) =>
      cat.questions.map((q) => ({
        "@type": "Question",
        name: q.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.a,
        },
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ヒーロー */}
      <section className="bg-rm-hero px-4 py-20 text-center text-white sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            よくある質問
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-white/60 sm:text-base">
            Roomlyについてお客様からよくいただくご質問をまとめました。
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl space-y-12">
          {faqCategories.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-lg font-semibold text-rm-primary sm:text-xl">
                {cat.category}
              </h2>
              <div className="mt-4 space-y-3">
                {cat.questions.map((faq) => (
                  <details
                    key={faq.q}
                    className="group rounded-lg border border-rm-border bg-rm-surface"
                  >
                    <summary className="flex cursor-pointer items-center justify-between p-5 text-[14px] font-medium text-rm-primary">
                      {faq.q}
                      <span className="ml-4 shrink-0 text-rm-text-muted transition-transform group-open:rotate-180">
                        &#x25BC;
                      </span>
                    </summary>
                    <div className="border-t border-rm-border px-5 py-4">
                      <p className="text-[13px] leading-relaxed text-rm-text-secondary">
                        {faq.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* お問い合わせ導線 */}
      <section className="bg-rm-surface px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-rm-primary sm:text-2xl">
            解決しない場合はお気軽にご相談ください
          </h2>
          <p className="mt-4 text-[14px] text-rm-text-secondary">
            このページで解決しないご質問がございましたら、お問い合わせフォームからご連絡ください。
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded bg-rm-accent px-10 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-rm-accent-light"
          >
            お問い合わせはこちら
          </Link>
        </div>
      </section>
    </>
  );
}
