"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 認証ページはレイアウトなしでそのまま表示
  const authPaths = ["/login", "/signup", "/reset-password", "/update-password"];
  if (authPaths.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  // 認証済み（未認証は middleware が /login にリダイレクト）
  return (
    <Sidebar>
      <Header />
      <main className="p-4 md:p-8">
        {children}
      </main>
    </Sidebar>
  );
}
