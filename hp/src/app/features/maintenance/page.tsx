import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "修繕管理",
  description: "Roomlyの修繕管理機能。修繕依頼の受付から業者手配・完了報告までをタイムライン形式で記録。対応漏れを防ぎ、物件の価値を維持します。",
  alternates: { canonical: "/features/maintenance" },
  openGraph: {
    title: "修繕管理 | Roomly",
    description: "依頼受付から業者手配、完了報告までを一元管理する賃貸管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/maintenance",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="修繕管理"
      lead="依頼の受付から業者手配、完了報告まで。対応漏れを防ぎ、物件の価値を維持します。"
      keywords={["修繕管理 ソフト", "賃貸 修繕 履歴", "原状回復 管理", "業者手配 効率化", "修繕依頼 受付 アプリ"]}
    />
  );
}
