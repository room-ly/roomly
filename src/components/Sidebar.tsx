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
  Receipt,
  Send,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/properties", label: "物件管理", icon: Building2 },
  { href: "/tenants", label: "入居者管理", icon: Users },
  { href: "/contracts", label: "契約管理", icon: FileText },
  { href: "/rent", label: "家賃管理", icon: Banknote },
  { href: "/maintenance", label: "修繕管理", icon: Wrench },
  { href: "/inquiries", label: "問い合わせ", icon: MessageSquare },
  { href: "/expenses", label: "経費管理", icon: Receipt },
  { href: "/owners", label: "オーナー管理", icon: UserCircle, managementOnly: true as const },
  { href: "/remittances", label: "送金管理", icon: Send, managementOnly: true as const },
  { href: "/settings", label: "設定", icon: Settings },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});
  const [usageType, setUsageType] = useState<string>("management_company");
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    fetch("/api/badge-counts")
      .then((res) => res.json())
      .then((data) => {
        const { usage_type, company_name, ...counts } = data;
        setBadgeCounts(counts);
        if (usage_type) setUsageType(usage_type);
        if (company_name) setCompanyName(company_name);
      })
      .catch(() => {});
  }, [pathname]);

  const isSelfManaged = usageType === "self_managed";
  const filteredNavItems = navItems.filter(
    (item) => !("managementOnly" in item && item.managementOnly && isSelfManaged)
  );

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* ロゴ */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold tracking-wide text-text">Roomly</span>
            <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium tracking-wider uppercase">Beta</span>
          </div>
        ) : (
          <span className="mx-auto text-sm font-bold text-accent">R</span>
        )}
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        <div className="space-y-0.5 px-2">
          {filteredNavItems.map((item) => {
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
                className={`tooltip-trigger flex items-center gap-2.5 py-2 text-[13px] rounded transition-colors duration-100 ${
                  collapsed ? "justify-center px-0" : "px-3"
                } ${
                  isActive
                    ? "bg-sidebar-active text-accent font-medium"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text"
                }`}
              >
                {isActive && !collapsed && (
                  <span className="absolute left-0 w-[3px] h-5 bg-accent rounded-r" />
                )}
                <Icon size={17} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {badge && badge > 0 && (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-medium rounded bg-danger/10 text-danger">
                        {badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && badge && badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-danger" />
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
      <div className="border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-full items-center gap-2.5 px-4 py-3 text-text-muted hover:text-text-secondary transition-colors text-[12px]"
        >
          {collapsed ? (
            <ChevronsRight size={15} className="mx-auto" />
          ) : (
            <>
              <ChevronsLeft size={15} />
              <span>折りたたむ</span>
            </>
          )}
        </button>
        {!collapsed && companyName && (
          <div className="px-4 py-2.5 text-[11px] text-text-muted border-t border-border-light">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-accent/10 flex items-center justify-center text-[9px] font-semibold text-accent">
                {companyName[0]}
              </div>
              <span>{companyName}</span>
            </div>
          </div>
        )}
        {collapsed && companyName && (
          <div className="py-2.5 flex justify-center border-t border-border-light">
            <div className="w-5 h-5 rounded bg-accent/10 flex items-center justify-center text-[9px] font-semibold text-accent">
              {companyName[0]}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* モバイル: ハンバーガー */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded bg-card shadow-sm text-text-secondary hover:text-text transition-colors"
      >
        <Menu size={18} />
      </button>

      {/* モバイル: オーバーレイ */}
      <div
        className={`sidebar-overlay md:hidden ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* モバイル: ドロワー */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[240px] bg-sidebar-bg flex flex-col z-50 md:hidden transition-transform duration-200 border-r border-border ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3.5 right-3 p-1 rounded text-text-muted hover:text-text transition-colors"
        >
          <X size={16} />
        </button>
        {sidebarContent}
      </aside>

      {/* デスクトップ: サイドバー */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-sidebar-bg flex-col z-50 transition-[width] duration-200 ease-out hidden md:flex border-r border-border ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* メインコンテンツ */}
      <div className="min-h-screen transition-[margin-left] duration-200 ease-out">
        {children}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .min-h-screen.transition-\\[margin-left\\] {
            margin-left: ${collapsed ? "64px" : "240px"};
          }
        }
      `}</style>
    </>
  );
}
