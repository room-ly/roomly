import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "家賃管理",
  description: "Roomlyの家賃管理機能。月次の家賃請求の自動生成、入金消込、滞納一覧と日数の自動カウントまで、家賃の請求・回収・督促を効率化します。",
  alternates: { canonical: "/features/rent-management" },
  openGraph: {
    title: "家賃管理 | Roomly",
    description: "請求・入金・滞納を一目で把握。督促のタイミングも見逃さない賃貸管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/rent-management",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="家賃管理"
      lead="請求・入金・滞納を一目で把握。督促のタイミングも見逃しません。"
      keywords={["家賃管理 ソフト", "家賃 入金消込", "家賃滞納 管理", "滞納 督促 タイミング", "家賃 請求書 自動作成"]}
    />
  );
}
