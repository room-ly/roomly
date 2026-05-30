import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "CSV/PDFエクスポート",
  description: "RoomlyのCSV・PDFエクスポート機能。物件・入居者・家賃データのCSV出力、オーナー向け月次報告書PDFを自動生成。会計ソフト連携にも対応します。",
  alternates: { canonical: "/features/export" },
  openGraph: {
    title: "CSV/PDFエクスポート | Roomly",
    description: "物件・入居者・家賃データのCSV出力と月次報告書PDFを自動生成する賃貸管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/export",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="CSV/PDFエクスポート"
      lead="物件・入居者・家賃データのCSV出力。オーナー向け月次報告書PDFも自動生成します。"
      keywords={["賃貸 CSV 出力", "月次報告書 PDF", "オーナー報告 自動", "家賃データ エクスポート", "会計ソフト 連携"]}
    />
  );
}
