import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "問い合わせ・クレーム管理",
  description: "Roomlyの問い合わせ管理機能。入居者からのクレーム・問い合わせを受付・対応履歴付きで管理。ステータス追跡で対応漏れを防止します。",
  alternates: { canonical: "/features/inquiries" },
  openGraph: {
    title: "問い合わせ・クレーム管理 | Roomly",
    description: "入居者からの問い合わせ・クレームを対応履歴付きで管理する賃貸管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/inquiries",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="問い合わせ・クレーム管理"
      lead="入居者からのクレーム・問い合わせを受付・対応履歴付きで管理。ステータス追跡で対応漏れを防止します。"
      keywords={["賃貸 クレーム 管理", "入居者 問い合わせ 一覧", "対応履歴 記録", "クレーム 対応漏れ 防止", "賃貸 苦情処理"]}
    />
  );
}
