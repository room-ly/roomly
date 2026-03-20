import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "Roomlyの導入相談・ご不明点・協業のご相談など、お気軽にお問い合わせください。",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "お問い合わせ | Roomly",
    description:
      "Roomlyの導入相談・ご不明点・協業のご相談など、お気軽にお問い合わせください。",
    type: "website",
    url: "https://hp.roomly.jp/contact",
    siteName: "Roomly",
    locale: "ja_JP",
  },
};

export default function ContactPage() {
  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center text-xl font-semibold text-rm-primary sm:text-2xl">
          お気軽にご相談ください
        </h1>
        <p className="mt-4 text-center text-[14px] text-rm-text-secondary">
          導入のご検討・ご不明点・協業のご相談など、お気軽にお問い合わせください。
        </p>
        <div className="mt-10">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
