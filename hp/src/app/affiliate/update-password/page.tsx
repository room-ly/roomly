import type { Metadata } from "next";
import AffiliateUpdatePasswordForm from "@/components/AffiliateUpdatePasswordForm";

export const metadata: Metadata = {
  title: "パスワード再設定",
  description: "Roomlyアフィリエイトプログラムのパスワードを再設定します。",
  robots: { index: false, follow: false },
  alternates: { canonical: "/affiliate/update-password" },
};

export default function AffiliateUpdatePasswordPage() {
  return (
    <section className="px-7 pt-20 pb-24 sm:pt-28">
      <AffiliateUpdatePasswordForm />
    </section>
  );
}
