"use client";

import { useAuth } from "@/lib/auth-context";
import Sidebar from "./Sidebar";
import Header from "./Header";
import LoginPage from "./LoginPage";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証
  if (!user) {
    return <LoginPage />;
  }

  // 認証済み
  return (
    <Sidebar>
      <Header />
      <main className="p-4 md:p-8">
        {children}
      </main>
    </Sidebar>
  );
}
