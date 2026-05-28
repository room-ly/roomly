import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import { PostHogProvider } from "@/lib/posthog";
import AppShell from "@/components/AppShell";
import GoogleAdsTag from "@/components/GoogleAdsTag";
import { getBadgeCounts } from "@/lib/queries";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Roomly - クラウド賃貸管理ソフト",
  description: "賃貸管理会社向けSaaS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let sidebarData: {
    badgeCounts: Record<string, number>;
    contractAlertDays: number;
    companyName: string;
    userName: string;
    userEmail: string;
  } | null = null;

  try {
    const data = await getBadgeCounts();
    const { company_name, user_name, user_email, contract_alert_days, ...counts } = data;
    sidebarData = {
      badgeCounts: counts as Record<string, number>,
      contractAlertDays: contract_alert_days,
      companyName: company_name,
      userName: user_name,
      userEmail: user_email,
    };
  } catch {
    // 未認証（ログインページ等）では取得できない
  }

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: "var(--font-sans)" }}>
        <GoogleAdsTag />
        <ThemeProvider>
          <AuthProvider>
            <PostHogProvider>
              <AppShell sidebarData={sidebarData}>
                {children}
              </AppShell>
            </PostHogProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
