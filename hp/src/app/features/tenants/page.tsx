import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "入居者管理",
  description: "Roomlyの入居者管理機能。入居者の個人情報・連絡先・緊急連絡先・保証人・契約履歴・支払い状況を一元管理。滞納アラートで対応漏れを防ぎます。",
  alternates: { canonical: "/features/tenants" },
  openGraph: {
    title: "入居者管理 | Roomly",
    description: "入居者情報・契約履歴・支払い状況をひと目で確認できる賃貸管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/tenants",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="入居者管理"
      lead="入居者の個人情報・連絡先・緊急連絡先・保証人情報をまとめて管理。契約履歴や支払い状況もひと目で確認できます。"
      keywords={["入居者管理 ソフト", "賃貸 入居者 台帳", "保証人 情報 管理", "滞納 アラート", "退去者 履歴 保管"]}
    />
  );
}
