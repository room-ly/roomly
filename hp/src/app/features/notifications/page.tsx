import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "通知機能",
  description: "Roomlyの通知機能。滞納発生・契約満了・修繕依頼をメールとアプリ内通知でお知らせ。賃貸管理業務での見落としを防ぎます。",
  alternates: { canonical: "/features/notifications" },
  openGraph: {
    title: "通知機能 | Roomly",
    description: "滞納・契約満了・修繕依頼をメールと通知でお知らせする賃貸管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/notifications",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="通知機能"
      lead="滞納発生・契約満了・修繕依頼をメールとアプリ内通知でお知らせ。見落とし防止に役立ちます。"
      keywords={["賃貸 通知 機能", "契約満了 通知", "滞納 アラート メール", "修繕依頼 通知", "管理会社 リマインド"]}
    />
  );
}
