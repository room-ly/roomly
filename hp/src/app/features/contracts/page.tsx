import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "契約管理",
  description: "Roomlyの契約管理機能。賃貸契約の作成・更新・解約をライフサイクル全体で管理。契約満了30日前の自動ハイライトで更新漏れを防止します。",
  alternates: { canonical: "/features/contracts" },
  openGraph: {
    title: "契約管理 | Roomly",
    description: "契約作成から更新・解約まで、ライフサイクル全体をカバーする賃貸管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/contracts",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="契約管理"
      lead="契約の作成から更新・解約まで、ライフサイクル全体をカバー。特約や条件も見やすく整理できます。"
      keywords={["賃貸契約 管理 ソフト", "契約更新 漏れ防止", "契約満了 アラート", "賃貸借契約書 電子化", "敷金精算 管理"]}
    />
  );
}
