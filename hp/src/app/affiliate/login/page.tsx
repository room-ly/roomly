import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "アフィリエイターログイン",
  description: "Roomlyアフィリエイトプログラムのログインページです。",
  robots: { index: false, follow: false },
  alternates: { canonical: "/affiliate/login" },
};

export default function AffiliateLoginPage() {
  return (
    <section className="px-7 pt-20 pb-24 text-center sm:pt-28">
      <div className="mx-auto max-w-xl">
        <h1 className="text-[28px] font-medium text-rm-primary">
          アフィリエイターログイン
        </h1>
        <p className="mt-5 text-[14px] text-rm-text-secondary leading-relaxed">
          ダッシュボード機能は準備中です。
          <br />
          承認済みのアフィリエイターの方には、別途メールでログイン手順をご案内します。
        </p>
        <p className="mt-6 text-[13px] text-rm-text-secondary">
          まだ申込されていない方は{" "}
          <Link href="/affiliate" className="text-rm-accent-deep underline">
            アフィリエイトプログラム
          </Link>{" "}
          ページからどうぞ。
        </p>
      </div>
    </section>
  );
}
