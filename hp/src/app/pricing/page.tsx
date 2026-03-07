import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "料金プラン",
  description:
    "Roomlyの料金プラン。10区画まで完全無料。全機能が使えるシンプルな区画数ベースの料金体系。初期費用・クレジットカード不要。",
};

const plans = [
  {
    name: "フリー",
    price: "¥0",
    unit: "/ 月",
    description: "小規模物件の管理に最適",
    quota: "10区画まで",
    highlight: false,
    features: [
      "全機能利用可能",
      "メールサポート",
      "CSVエクスポート",
      "PDF報告書生成",
    ],
  },
  {
    name: "スタンダード",
    price: "¥5,000",
    unit: "（税込）/ 月",
    description: "成長中の管理会社に",
    quota: "11〜50区画",
    highlight: true,
    features: [
      "全機能利用可能",
      "優先メールサポート",
      "CSVエクスポート",
      "PDF報告書生成",
      "複数ユーザー管理",
    ],
  },
  {
    name: "プロ",
    price: "¥10,000",
    unit: "（税込）/ 月",
    description: "中規模管理会社向け",
    quota: "51〜100区画",
    highlight: false,
    features: [
      "全機能利用可能",
      "優先メールサポート",
      "CSVエクスポート",
      "PDF報告書生成",
      "複数ユーザー管理",
      "RBAC権限管理",
    ],
  },
];

const faqs = [
  {
    q: "無料プランに期限はありますか？",
    a: "いいえ。10区画以内であれば、期限なくずっと無料でお使いいただけます。",
  },
  {
    q: "プラン変更はいつでもできますか？",
    a: "はい。区画数の増減に応じて、いつでもプランを変更できます。日割り計算で精算されます。",
  },
  {
    q: "101区画以上の場合はどうなりますか？",
    a: "個別にお見積りいたします。お問い合わせフォームからご連絡ください。",
  },
  {
    q: "解約時の違約金はありますか？",
    a: "ありません。いつでも解約でき、違約金は一切発生しません。",
  },
  {
    q: "支払い方法は？",
    a: "クレジットカード（Visa / Mastercard / JCB）に対応予定です。無料プランではカード登録不要です。",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* ヒーロー */}
      <section className="bg-rm-hero px-4 py-20 text-center text-white sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            シンプルな料金体系
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-white/60 sm:text-base">
            区画数に応じた分かりやすい料金。全プランで全機能が使えます。
          </p>
        </div>
      </section>

      {/* 料金プラン */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-lg p-6 shadow-sm ${
                  plan.highlight
                    ? "border-2 border-rm-accent bg-rm-surface"
                    : "border border-rm-border bg-rm-surface"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rm-accent px-4 py-0.5 text-[11px] font-medium text-white">
                    おすすめ
                  </div>
                )}
                <div className="text-center">
                  <p className="text-[13px] font-medium text-rm-text-muted">{plan.name}</p>
                  <div className="mt-2">
                    <span className="text-3xl font-semibold tabular-nums text-rm-primary">{plan.price}</span>
                    <span className="ml-1 text-[13px] text-rm-text-muted">{plan.unit}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-rm-text-muted">{plan.quota}</p>
                  <p className="mt-3 text-[13px] text-rm-text-secondary">{plan.description}</p>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-[13px] text-rm-text-secondary">
                      <CheckCircle2 size={14} className="shrink-0 text-rm-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://roomly.jp"
                  className={`mt-6 block rounded py-2.5 text-center text-[13px] font-medium transition-colors ${
                    plan.highlight
                      ? "bg-rm-accent text-white hover:bg-rm-accent-light"
                      : "border border-rm-border text-rm-text-secondary hover:bg-rm-bg"
                  }`}
                >
                  {plan.price === "¥0" ? "無料で始める" : "プランを選択"}
                </a>
              </div>
            ))}
          </div>

          {/* 101区画以上 */}
          <div className="mt-8 rounded-lg border border-rm-border bg-rm-surface p-6 text-center">
            <p className="text-[14px] font-medium text-rm-primary">101区画以上をお持ちの方</p>
            <p className="mt-2 text-[13px] text-rm-text-secondary">
              個別にお見積りいたします。まずはお気軽にご相談ください。
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block rounded border border-rm-border px-6 py-2 text-[13px] font-medium text-rm-text-secondary transition-colors hover:bg-rm-bg"
            >
              お問い合わせ
            </Link>
          </div>
        </div>
      </section>

      {/* 全プラン共通 */}
      <section className="bg-rm-surface px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-semibold text-rm-primary sm:text-2xl">
            全プラン共通
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              "初期費用なし",
              "全機能利用可能",
              "クレジットカード不要で開始",
              "メールサポート付き",
              "データ暗号化（SSL/TLS）",
              "自動バックアップ",
              "いつでも解約可能",
              "違約金なし",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded bg-white p-4 dark:bg-[var(--rm-bg)]">
                <CheckCircle2 size={16} className="shrink-0 text-rm-accent" />
                <span className="text-[14px] text-rm-text-secondary">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金FAQ */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-semibold text-rm-primary sm:text-2xl">
            よくある質問
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg border border-rm-border bg-rm-surface p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle size={16} className="mt-0.5 shrink-0 text-rm-accent" />
                  <div>
                    <p className="text-[14px] font-semibold text-rm-primary">{faq.q}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-rm-text-secondary">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-rm-surface px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-rm-primary sm:text-2xl">
            まずは無料で試してみませんか？
          </h2>
          <p className="mt-4 text-[14px] text-rm-text-secondary">
            10区画まで無料。クレジットカード不要で、すぐに始められます。
          </p>
          <a
            href="https://roomly.jp"
            className="mt-8 inline-block rounded bg-rm-accent px-10 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-rm-accent-light"
          >
            無料で始める
          </a>
        </div>
      </section>
    </>
  );
}
