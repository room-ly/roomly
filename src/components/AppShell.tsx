"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export interface SidebarInitialData {
  badgeCounts: Record<string, number>;
  companyName: string;
  userName: string;
  userEmail: string;
}

export default function AppShell({ children, sidebarData }: { children: React.ReactNode; sidebarData: SidebarInitialData | null }) {
  const pathname = usePathname();

  const authPaths = ["/login", "/signup", "/reset-password", "/update-password"];
  if (authPaths.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <Sidebar initialData={sidebarData}>
      <Header />
      <main className="px-8 py-7 max-w-[1320px] relative z-0">
        {children}
      </main>
    </Sidebar>
  );
}
