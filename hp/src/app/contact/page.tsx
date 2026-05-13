import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "Roomlyの導入相談・ご不明点・協業のご相談など、お気軽にお問い合わせください。",
  alternates: { canonical: "/contact" },
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
    <>
      <section className="px-7 pt-20 pb-16 text-center sm:pt-28">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Contact</span>
          <h1 className="mt-6 text-[clamp(32px,5vw,48px)] font-medium leading-tight tracking-tight text-rm-primary">
            お気軽に<em className="font-serif-display italic text-rm-accent-deep font-normal">ご相談</em>ください
          </h1>
          <p className="mt-5 text-[16px] text-rm-text-secondary">
            導入のご検討・ご不明点・協業のご相談など、お気軽にお問い合わせください。
          </p>
        </div>
      </section>

      <section className="px-7 pb-24">
        <ContactForm />
      </section>
    </>
  );
}
