"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CommandPalette from "./CommandPalette";
import BetaNotice from "./BetaNotice";
import DemoNotice from "./DemoNotice";

export interface SidebarInitialData {
  badgeCounts: Record<string, number>;
  contractAlertDays: number;
  companyName: string;
  userName: string;
  userEmail: string;
  isDemo: boolean;
}

export default function AppShell({ children, sidebarData }: { children: React.ReactNode; sidebarData: SidebarInitialData | null }) {
  const pathname = usePathname();

  const authPaths = ["/login", "/signup", "/reset-password", "/update-password"];
  if (authPaths.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <Sidebar initialData={sidebarData}>
      {sidebarData?.isDemo ? <DemoNotice /> : <BetaNotice />}
      <Header />
      <main className="page">
        {children}
      </main>
      <CommandPalette />
    </Sidebar>
  );
}
