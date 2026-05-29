import type { Metadata } from "next";
import AffiliateLoginForm from "@/components/AffiliateLoginForm";

export const metadata: Metadata = {
  title: "アフィリエイターログイン",
  description: "Roomlyアフィリエイトプログラムのログインページです。",
  robots: { index: false, follow: false },
  alternates: { canonical: "/affiliate/login" },
};

export default function AffiliateLoginPage() {
  return (
    <section className="px-7 pt-20 pb-24 sm:pt-28">
      <AffiliateLoginForm />
    </section>
  );
}
