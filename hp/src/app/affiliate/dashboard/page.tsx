import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "アフィリエイターダッシュボード",
  description: "Roomlyアフィリエイトプログラムのダッシュボードです。",
  robots: { index: false, follow: false },
  alternates: { canonical: "/affiliate/dashboard" },
};

export default function AffiliateDashboardPage() {
  return (
    <section className="px-7 pt-20 pb-24 text-center sm:pt-28">
      <div className="mx-auto max-w-xl">
        <h1 className="text-[28px] font-medium text-rm-primary">
          ダッシュボード準備中
        </h1>
        <p className="mt-5 text-[14px] text-rm-text-secondary leading-relaxed">
          紹介リンク・クリック数・成果・累計報酬を確認できるダッシュボードを準備しています。
          <br />
          当面の間、成果状況については毎月メールでお知らせします。
        </p>
        <p className="mt-6 text-[13px] text-rm-text-secondary">
          <Link href="/affiliate" className="text-rm-accent-deep underline">
            アフィリエイトプログラム
          </Link>{" "}
          に戻る
        </p>
      </div>
    </section>
  );
}
