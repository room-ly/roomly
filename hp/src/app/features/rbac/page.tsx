import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "権限管理(RBAC)",
  description: "Roomlyの権限管理機能。管理者・マネージャー・スタッフ・閲覧者の4ロールで、賃貸管理業務の操作権限をきめ細かく制御できます。",
  alternates: { canonical: "/features/rbac" },
  openGraph: {
    title: "権限管理(RBAC) | Roomly",
    description: "4ロールで操作権限をきめ細かく制御する賃貸管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/rbac",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="権限管理(RBAC)"
      lead="管理者・マネージャー・スタッフ・閲覧者の4ロールで、操作権限をきめ細かく制御できます。"
      keywords={["賃貸 管理 権限", "RBAC SaaS", "ロール 権限 設定", "スタッフ 閲覧 権限", "管理会社 権限分離"]}
    />
  );
}
