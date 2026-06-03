import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import { PostHogProvider } from "@/lib/posthog";
import AppShell from "@/components/AppShell";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { getBadgeCounts } from "@/lib/queries";
import { createClient as createServerSupabase } from "@/lib/supabase-server";

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
    isDemo: boolean;
    loanFeatureEnabled: boolean;
  } | null = null;

  try {
    const data = await getBadgeCounts();
    const { company_name, user_name, user_email, contract_alert_days, is_demo, loan_feature_enabled, ...counts } = data;
    sidebarData = {
      badgeCounts: counts as Record<string, number>,
      contractAlertDays: contract_alert_days,
      companyName: company_name,
      userName: user_name,
      userEmail: user_email,
      isDemo: is_demo,
      loanFeatureEnabled: loan_feature_enabled,
    };
  } catch {
    // 未認証（ログインページ等）では取得できない
  }

  // SSR で users テーブルから profile を引いて AuthProvider に初期値として渡す。
  // これによりクライアントの fetchProfile が解決するまでの「user=null」期間がなくなり、
  // 編集ボタン等が一瞬消える事故が物理的に発生しない。
  let initialUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    company_id: string;
  } | null = null;
  try {
    const supabase = await createServerSupabase();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from("users")
        .select("id, name, email, role, company_id, is_active")
        .eq("id", authUser.id)
        .single();
      if (profile && profile.is_active !== false) {
        initialUser = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          company_id: profile.company_id,
        };
      }
    }
  } catch {
    // 未認証 or DB一時障害 → クライアント側fetchProfileに任せる
  }

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: "var(--font-sans)" }}>
        <GoogleAnalytics />
        <ThemeProvider>
          <AuthProvider initialUser={initialUser}>
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
