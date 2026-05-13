import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description: "Roomlyの特定商取引法に基づく表記。事業者情報・返品ポリシー等を記載しています。",
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <section className="px-7 pt-20 pb-24 sm:pt-28">
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow">Legal</span>
        <h1 className="mt-6 text-[clamp(28px,4vw,42px)] font-medium leading-tight tracking-tight text-rm-primary">
          特定商取引法に基づく表記
        </h1>
        <p className="mt-4 text-[14px] text-rm-text-muted">最終更新日: 2026年5月11日</p>

        <div className="mt-10 rounded-2xl border border-rm-border bg-rm-surface overflow-hidden">
          {([
            ["事業者名", "zh"],
            ["代表者", "請求があった場合に遅滞なく開示します"],
            ["所在地", "請求があった場合に遅滞なく開示します"],
            ["電話番号", "請求があった場合に遅滞なく開示します"],
            ["メールアドレス", "お問い合わせフォームよりご連絡ください"],
            ["サービス名", "Roomly"],
            ["サービスURL", "https://roomly.jp"],
            ["販売価格", "無料プラン: ¥0 / 有料プラン: ¥5,000（税込）/月〜（料金ページに詳細記載）"],
            ["支払い方法", "クレジットカード（Visa / Mastercard / JCB）対応予定"],
            ["支払い時期", "有料プラン切り替え時に決済。以後、月額自動更新"],
            ["サービス提供時期", "アカウント登録後、即時利用可能"],
            ["返品・キャンセル", "デジタルサービスの性質上、返品はお受けしておりません。いつでも解約可能で、解約後は次の更新日から課金が停止されます。違約金はありません"],
            ["動作環境", "Google Chrome / Safari / Firefox / Edge の最新バージョン"],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex border-b border-rm-border last:border-b-0">
              <div className="w-[180px] shrink-0 bg-rm-surface-tint px-5 py-4 text-[13px] font-medium text-rm-text sm:w-[220px]">
                {label}
              </div>
              <div className="px-5 py-4 text-[14px] text-rm-text-secondary">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
