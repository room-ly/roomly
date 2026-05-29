import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AffiliateAuthTabs from "@/components/AffiliateAuthTabs";
import { createAffiliateServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "アフィリエイトプログラム",
  description:
    "Roomlyのアフィリエイトプログラム。ご紹介いただいた管理会社・大家さんが有料プランを継続している限り、月額の10%を期限なくずっと還元します。",
  alternates: { canonical: "/affiliate" },
  openGraph: {
    title: "アフィリエイトプログラム | Roomly",
    description:
      "ご紹介いただいた管理会社・大家さんが有料プランを継続している限り、月額の10%を期限なくずっと還元します。",
    type: "website",
    url: "https://hp.roomly.jp/affiliate",
    siteName: "Roomly",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "アフィリエイトプログラム | Roomly",
    description:
      "紹介された方が有料プランを続ける限り、月額の10%を期限なくずっと還元します。",
  },
};

export default async function AffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // ログイン済ならダッシュボードへ
  const supabase = await createAffiliateServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/affiliate/dashboard");
  }

  const params = await searchParams;
  const initialTab = params.tab === "login" ? "login" : "signup";

  return (
    <>
      <section className="px-7 pt-20 pb-12 text-center sm:pt-28">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Affiliate Program</span>
          <h1 className="mt-6 text-[clamp(32px,5vw,48px)] font-medium leading-tight tracking-tight text-rm-primary">
            紹介した方が続く限り、<br />
            <em className="font-serif-display italic text-rm-accent-deep font-normal">ずっと還元</em>します
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-rm-text-secondary">
            ご紹介いただいた管理会社・大家さんが有料プランを継続している限り、
            <br className="hidden sm:block" />
            月額の10%を期限なく毎月還元します。
          </p>
        </div>
      </section>

      <section id="apply" className="px-7 pb-16">
        <div className="mx-auto max-w-md">
          <AffiliateAuthTabs initialTab={initialTab} />
        </div>
      </section>

      <section className="px-7 pb-16">
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-rm-border bg-rm-surface p-7">
            <div className="text-[13px] text-rm-text-secondary">初回報酬</div>
            <div className="mt-2 text-[28px] font-medium text-rm-primary">¥0</div>
            <p className="mt-2 text-[13px] text-rm-text-secondary leading-relaxed">
              初回成果報酬はありません。継続報酬に集約しています。
            </p>
          </div>
          <div className="rounded-2xl border-2 border-rm-accent-deep bg-rm-surface p-7">
            <div className="text-[13px] text-rm-accent-deep font-medium">継続報酬</div>
            <div className="mt-2 text-[28px] font-medium text-rm-primary">月額の10%</div>
            <p className="mt-2 text-[13px] text-rm-text-secondary leading-relaxed">
              紹介された会社が支払う月額利用料の10%を毎月還元します。
            </p>
          </div>
          <div className="rounded-2xl border border-rm-border bg-rm-surface p-7">
            <div className="text-[13px] text-rm-text-secondary">還元期間</div>
            <div className="mt-2 text-[28px] font-medium text-rm-primary">期限なし</div>
            <p className="mt-2 text-[13px] text-rm-text-secondary leading-relaxed">
              紹介された会社が利用を続ける限り、何ヶ月でも報酬が発生し続けます。
            </p>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-rm-border bg-rm-bg p-6 text-[14px] leading-relaxed text-rm-text-secondary">
          <p className="font-medium text-rm-primary">報酬の試算例</p>
          <p className="mt-2">
            ご紹介者が <span className="text-rm-primary font-medium">月額¥10,000（税込）のプラン</span> を
            利用している限り、毎月
            <span className="text-rm-accent-deep font-medium"> ¥1,000（税込） </span>
            が継続的に発生します。仮に5年（60ヶ月）継続すれば1社あたり累計
            <span className="text-rm-accent-deep font-medium"> ¥60,000（税込） </span>。
            複数社をご紹介いただくほど、毎月の収益がストックとして積み上がっていきます。
          </p>
        </div>
      </section>

      <section className="px-7 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[22px] font-medium text-rm-primary">こんな方におすすめ</h2>
          <ul className="mt-5 grid gap-3 text-[14px] text-rm-text">
            <li className="rounded-xl border border-rm-border bg-rm-surface px-5 py-4">
              <span className="text-rm-accent-deep font-medium">不動産・賃貸経営の情報発信</span> をされている方（ブログ・YouTube・SNS）
            </li>
            <li className="rounded-xl border border-rm-border bg-rm-surface px-5 py-4">
              <span className="text-rm-accent-deep font-medium">大家コミュニティ・大家会</span> を主催されている方
            </li>
            <li className="rounded-xl border border-rm-border bg-rm-surface px-5 py-4">
              <span className="text-rm-accent-deep font-medium">不動産特化の税理士・司法書士・FP</span> として顧客をお持ちの方
            </li>
            <li className="rounded-xl border border-rm-border bg-rm-surface px-5 py-4">
              <span className="text-rm-accent-deep font-medium">複数物件を所有する大家</span> として、同業の知人にお勧めいただける方
            </li>
          </ul>
        </div>
      </section>

      <section className="px-7 pb-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[22px] font-medium text-rm-primary">参加の流れ</h2>
          <ol className="mt-5 space-y-4 text-[14px] text-rm-text">
            <li className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rm-accent-deep text-white text-[13px] font-medium">1</span>
              <div>
                <div className="font-medium text-rm-primary">メールアドレスとパスワードで登録</div>
                <p className="mt-1 text-rm-text-secondary">審査なし。送信した瞬間にダッシュボードが開き、紹介リンクが発行されます。</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rm-accent-deep text-white text-[13px] font-medium">2</span>
              <div>
                <div className="font-medium text-rm-primary">紹介リンクで集客</div>
                <p className="mt-1 text-rm-text-secondary">ブログ・SNS・コミュニティで紹介リンクを共有してください。クリック数と成果はダッシュボードからいつでも確認できます。</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rm-accent-deep text-white text-[13px] font-medium">3</span>
              <div>
                <div className="font-medium text-rm-primary">毎月25日に振込</div>
                <p className="mt-1 text-rm-text-secondary">前月までに確定した報酬を、ご登録の口座へお振込みします（最低支払額¥3,000）。振込先は別途ご登録いただきます。</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </>
  );
}
