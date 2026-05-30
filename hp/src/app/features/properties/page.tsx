import type { Metadata } from "next";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

export const metadata: Metadata = {
  title: "物件・部屋管理",
  description: "Roomlyの物件・部屋管理機能。建物情報・間取り・設備・写真の登録から空室状況のリアルタイム把握まで、賃貸管理に必要な物件データを一元管理できます。",
  alternates: { canonical: "/features/properties" },
  openGraph: {
    title: "物件・部屋管理 | Roomly",
    description: "建物・部屋の情報を一元管理。間取り・設備・写真もまとめて登録できる賃貸管理SaaS。",
    type: "website",
    url: "https://hp.roomly.jp/features/properties",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function Page() {
  return (
    <FeatureComingSoon
      title="物件・部屋管理"
      lead="建物・部屋の情報を一元管理。間取り・設備・写真もまとめて登録できます。"
      keywords={["物件管理 ソフト", "賃貸 物件台帳", "空室管理 一覧", "部屋情報 一元管理", "物件 写真 管理"]}
    />
  );
}
