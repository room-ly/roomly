import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roomly ポータル | おとり物件なしの賃貸検索",
  description:
    "管理会社の空室データをリアルタイムに掲載。おとり物件ゼロの賃貸物件検索サイト。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="bg-primary text-white">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-wide">
              Roomly ポータル
            </Link>
            <p className="text-sm text-blue-200">
              おとり物件なし・リアルタイム空室情報
            </p>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-primary text-blue-200 text-sm">
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>&copy; {new Date().getFullYear()} Roomly</p>
            <div className="flex gap-4">
              <Link href="/" className="hover:text-white">
                物件を探す
              </Link>
              <a
                href="https://roomly.jp"
                className="hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                管理会社の方はこちら
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
