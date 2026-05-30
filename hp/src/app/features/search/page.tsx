import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "検索・フィルタ・ソート",
  description: "Roomlyの検索・フィルタ機能。物件・入居者・契約・家賃・修繕など全画面で横断検索・ステータスフィルタ・ソートに対応。必要な情報にすぐたどり着けます。",
  alternates: { canonical: "/features/search" },
  openGraph: {
    title: "検索・フィルタ・ソート | Roomly",
    description: "全画面で横断検索・ステータスフィルタ・ソートに対応する賃貸管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/search",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="検索・フィルタ・ソート"
      lead="全画面で横断検索・ステータスフィルタ・ソート・ページネーションに対応します。"
      keywords={["賃貸管理 検索 機能", "入居者 絞り込み", "物件 ステータス フィルタ", "家賃 一覧 ソート", "管理データ 横断検索"]}
    />
  );
}
