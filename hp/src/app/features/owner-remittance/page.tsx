import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "オーナー送金",
  description: "Roomlyのオーナー送金機能。月次精算・管理手数料の差引・送金明細PDFの自動作成まで、オーナーへの月次報告書作成を効率化します。",
  alternates: { canonical: "/features/owner-remittance" },
  openGraph: {
    title: "オーナー送金 | Roomly",
    description: "月次の精算・送金明細を自動で作成する賃貸管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/owner-remittance",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="オーナー送金"
      lead="月次の精算・送金明細を自動で作成。管理費の差し引きも計算不要です。"
      keywords={["オーナー送金 ソフト", "賃貸 月次精算", "送金明細 自動作成", "オーナー報告書 PDF", "管理手数料 計算"]}
    />
  );
}
