import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Roomly Admin",
    template: "%s | Roomly Admin",
  },
  description: "Roomly運営者向け管理コンソール",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
