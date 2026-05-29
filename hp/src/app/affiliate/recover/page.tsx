import type { Metadata } from "next";
import AffiliateRecoverForm from "@/components/AffiliateRecoverForm";

export const metadata: Metadata = {
  title: "ダッシュボードURLの再送",
  description: "RoomlyアフィリエイトプログラムのダッシュボードURLを再送します。",
  robots: { index: false, follow: false },
  alternates: { canonical: "/affiliate/recover" },
};

export default function AffiliateRecoverPage() {
  return (
    <section className="px-7 pt-20 pb-24 sm:pt-28">
      <AffiliateRecoverForm />
    </section>
  );
}
