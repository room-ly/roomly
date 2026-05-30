import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "ダッシュボード",
  description: "Roomlyのダッシュボード機能。入居率・回収率・空室数・滞納件数などのKPIをリアルタイムで確認。月次推移グラフで賃貸経営の傾向を把握できます。",
  alternates: { canonical: "/features/dashboard" },
  openGraph: {
    title: "ダッシュボード | Roomly",
    description: "賃貸経営のKPIをリアルタイムで把握できる管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/dashboard",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="ダッシュボード"
      lead="入居率・回収率・空室数・滞納件数などのKPIをリアルタイムで確認。月次推移グラフで傾向も把握できます。"
      keywords={["賃貸 ダッシュボード", "入居率 計算", "回収率 KPI", "空室率 可視化", "賃貸 経営 分析"]}
    />
  );
}
