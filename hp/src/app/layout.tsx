import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const GA_ID = "G-Y2943F8G2J";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hp.roomly.jp"),
  title: {
    default: "Roomly | 賃貸管理を、もっとシンプルに。",
    template: "%s | Roomly",
  },
  description:
    "賃貸管理会社向けSaaS。物件・入居者・契約・家賃・修繕・オーナー送金を一つの画面で一元管理。10区画まで無料。",
  alternates: {
    canonical: "https://hp.roomly.jp",
  },
  openGraph: {
    siteName: "Roomly",
    locale: "ja_JP",
    type: "website",
    url: "https://hp.roomly.jp",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roomly | 賃貸管理を、もっとシンプルに。",
    description:
      "賃貸管理会社向けSaaS。物件・入居者・契約・家賃・修繕・オーナー送金を一つの画面で一元管理。10区画まで無料。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
        </Script>
      </head>
      <body className={`${notoSansJP.className} antialiased`}>
        <GoogleAnalytics />
        <ThemeProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
