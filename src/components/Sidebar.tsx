"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Banknote,
  Wrench,
  MessageSquare,
  UserCircle,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Building,
} from "lucide-react";
import { maintenanceRequests, rentBillings, inquiries } from "@/lib/mock-data";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/properties", label: "物件管理", icon: Building2 },
  { href: "/tenants", label: "入居者管理", icon: Users },
  { href: "/contracts", label: "契約管理", icon: FileText },
  { href: "/rent", label: "家賃管理", icon: Banknote },
  { href: "/maintenance", label: "修繕管理", icon: Wrench },
  { href: "/inquiries", label: "問い合わせ", icon: MessageSquare },
  { href: "/owners", label: "オーナー管理", icon: UserCircle },
  { href: "/settings", label: "設定", icon: Settings },
];

// バッジカウント
function getBadgeCounts(): Record<string, number> {
  const overdueRent = rentBillings.filter((b) => b.status === "overdue").length;
  const openMaintenance = maintenanceRequests.filter(
    (m) => m.status === "open" || m.status === "in_progress"
  ).length;
  const openInquiries = inquiries.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  ).length;
  return {
    "/rent": overdueRent,
    "/maintenance": openMaintenance,
    "/inquiries": openInquiries,
  };
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const badgeCounts = getBadgeCounts();

  // localStorageから折りたたみ状態を復元
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  // 折りたたみ状態をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // ページ遷移時にモバイルメニューを閉じる
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // モバイルメニュー開閉時のスクロール制御
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* ロゴ */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
              <Building size={16} className="text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-wide">Roomly</span>
              <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded-full font-medium">Beta</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
            <Building size={16} className="text-white" />
          </div>
        )}
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <div className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            const badge = badgeCounts[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`tooltip-trigger flex items-center gap-3 py-2.5 text-[13px] rounded-lg transition-all duration-150 ${
                  collapsed ? "justify-center px-0" : "px-3"
                } ${
                  isActive
                    ? "bg-white/15 text-white font-medium shadow-sm"
                    : "text-white/60 hover:bg-white/8 hover:text-white/90"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {badge && badge > 0 && (
                      <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[11px] font-semibold rounded-full bg-danger text-white">
                        {badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && badge && badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-danger" />
                )}
                {collapsed && (
                  <span className="tooltip">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* フッター */}
      <div className="border-t border-white/10">
        {/* 折りたたみトグル（デスクトップ） */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-full items-center gap-3 px-4 py-3 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all text-[13px]"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} className="mx-auto" />
          ) : (
            <>
              <PanelLeftClose size={18} />
              <span>メニューを閉じる</span>
            </>
          )}
        </button>
        {!collapsed && (
          <div className="px-4 py-3 text-[11px] text-white/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50">
                S
              </div>
              <span>サンプル不動産管理</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="py-3 flex justify-center">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50">
              S
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* モバイル: ハンバーガーボタン */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card border border-border shadow-md text-text-secondary hover:text-text transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* モバイル: オーバーレイ */}
      <div
        className={`sidebar-overlay md:hidden ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* モバイル: ドロワーサイドバー */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[280px] bg-primary text-white flex flex-col z-50 md:hidden transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      {/* デスクトップ: サイドバー */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-primary text-white flex-col z-50 transition-[width] duration-200 ease-out hidden md:flex ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* メインコンテンツ */}
      <div className="min-h-screen transition-[margin-left] duration-200 ease-out">
        {children}
      </div>

      {/* マージン制御 */}
      <style>{`
        @media (min-width: 768px) {
          .min-h-screen.transition-\\[margin-left\\] {
            margin-left: ${collapsed ? "72px" : "256px"};
          }
        }
      `}</style>
    </>
  );
}
