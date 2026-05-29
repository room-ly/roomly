"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Banknote,
  Wrench,
  UserCircle,
  Receipt,
  Send,
  Menu,
  X,
  LogOut,
  MoreHorizontal,
  Settings,
  BookUser,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { SidebarInitialData } from "./AppShell";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navGroups = [
  {
    group: "Workspace",
    items: [
      { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
      { href: "/properties", label: "物件", icon: Building2 },
      { href: "/tenants", label: "入居者", icon: Users },
      { href: "/contracts", label: "契約", icon: FileText },
    ] as NavItem[],
  },
  {
    group: "Operations",
    items: [
      { href: "/rent", label: "家賃", icon: Banknote },
      { href: "/cases", label: "対応案件", icon: Wrench },
      { href: "/expenses", label: "経費", icon: Receipt },
    ] as NavItem[],
  },
  {
    group: "Finance",
    items: [
      { href: "/owners", label: "オーナー", icon: UserCircle },
      { href: "/remittances", label: "送金", icon: Send },
      { href: "/payments", label: "支払い出力", icon: CreditCard },
      { href: "/payees", label: "支払先", icon: BookUser },
    ] as NavItem[],
  },
];

export default function Sidebar({ children, initialData }: { children: React.ReactNode; initialData: SidebarInitialData | null }) {
  const pathname = usePathname();
  const { logout, user: authUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>(initialData?.badgeCounts ?? {});
  const [alertDays, setAlertDays] = useState<number>(initialData?.contractAlertDays ?? 90);
  const [companyName, setCompanyName] = useState<string>(initialData?.companyName ?? "");
  const [displayUser, setDisplayUser] = useState<{ name: string; email: string }>({
    name: initialData?.userName ?? "",
    email: initialData?.userEmail ?? "",
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const fetchBadgeCounts = useCallback((retryCount = 0) => {
    fetch("/api/badge-counts")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const { company_name, user_name, user_email, contract_alert_days, ...counts } = data;
        const hasData = Object.values(counts).some((v) => (v as number) > 0) || user_name || user_email;
        if (!hasData && retryCount < 2) {
          setTimeout(() => fetchBadgeCounts(retryCount + 1), 1500);
          return;
        }
        setBadgeCounts(counts as Record<string, number>);
        if (typeof contract_alert_days === "number") setAlertDays(contract_alert_days);
        if (company_name) setCompanyName(company_name);
        if (user_name || user_email) {
          setDisplayUser({ name: user_name || "", email: user_email || "" });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isFirstRender.current && initialData) {
      isFirstRender.current = false;
      return;
    }
    isFirstRender.current = false;
    fetchBadgeCounts();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // AuthContext のセッション変更時にデータを再取得
  useEffect(() => {
    if (authUser) {
      setDisplayUser((prev) => ({
        name: authUser.name || prev.name,
        email: authUser.email || prev.email,
      }));
      fetchBadgeCounts();
    }
  }, [authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // ref はモバイル/デスクトップ両方の sidebarContent でレンダリングされて1つしか保持できないので、
      // data 属性で両方を判定する
      const target = e.target as Element | null;
      if (target && !target.closest?.("[data-user-menu]")) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getBadgeKind = (href: string): string | undefined => {
    if (href === "/") return "danger";
    if (href === "/rent") return "danger";
    if (href === "/cases") return "danger";
    if (href === "/contracts") return "warn";
    return undefined;
  };

  // バッジが何を集計しているかの説明（ホバー時のツールチップ用）
  const getBadgeTitle = (href: string, count: number): string => {
    switch (href) {
      case "/":
        return `要対応 合計 ${count}件（家賃滞納・緊急/放置中の対応案件・更新間近の契約）`;
      case "/rent":
        return `滞納中の家賃請求 ${count}件`;
      case "/cases":
        return `緊急、または3日以上放置されている対応案件 ${count}件`;
      case "/contracts":
        return `契約満了まで${alertDays}日以内の有効契約 ${count}件`;
      default:
        return `${count}件`;
    }
  };

  const sidebarContent = (
    <>
      {/* ブランド */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-line">
        <span className="w-7 h-7 rounded-lg bg-ink text-bg grid place-items-center text-[15px] font-semibold">R</span>
        <span className="font-semibold text-[15px] tracking-tight text-ink">Roomly</span>
        <span className="ml-auto font-mono text-[10px] text-ink-3 tracking-wider px-1.5 py-0.5 rounded-full bg-surface border border-line">
          beta
        </span>
      </div>

      {/* 組織 */}
      {companyName && (
        <div className="mx-4 mt-3.5 p-2.5 bg-surface border border-line rounded-[var(--r-md)] flex items-center gap-2.5 cursor-pointer hover:border-line-2 transition-colors">
          <span className="w-[26px] h-[26px] rounded-[7px] bg-accent-tint text-accent-deep grid place-items-center text-[12px] font-semibold">
            {companyName[0]}
          </span>
          <span className="text-[13px] font-medium truncate min-w-0">{companyName}</span>
        </div>
      )}

      {/* ナビゲーション */}
      <nav className="mt-4 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        {navGroups.map((g) => {
          const filteredItems = g.items;
          if (filteredItems.length === 0) return null;
          return (
            <div key={g.group} className="mb-4">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-4 px-6 py-1.5 mb-1">
                {g.group}
              </div>
              {filteredItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                const badge = badgeCounts[item.href];
                const badgeKind = getBadgeKind(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2.5 py-[7px] px-6 text-[13.5px] rounded-[7px] mx-4 mb-px transition-all duration-100 ${
                      isActive
                        ? "bg-surface text-ink font-medium shadow-[0_1px_2px_rgba(40,32,12,0.04)]"
                        : "text-ink-2 hover:bg-surface hover:text-ink"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-[7px] bottom-[7px] w-[2px] bg-accent-deep rounded-full" />
                    )}
                    <span className={`w-4 shrink-0 ${isActive ? "text-accent-deep" : "text-ink-3"}`}>
                      <Icon size={16} />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {typeof badge === "number" && badge > 0 && (
                      <span
                        aria-label={getBadgeTitle(item.href, badge)}
                        className={`font-mono text-[10px] px-1.5 py-px rounded-full border ${
                          badgeKind === "danger"
                            ? "bg-danger-tint text-danger border-transparent"
                            : badgeKind === "warn"
                            ? "bg-warn-tint text-warn border-transparent"
                            : "bg-bg text-ink-2 border-line"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}

        {/* System */}
        <div className="mb-4">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-4 px-6 py-1.5 mb-1">
            System
          </div>
          <Link
            href="/settings"
            className={`relative flex items-center gap-2.5 py-[7px] px-6 text-[13.5px] rounded-[7px] mx-4 mb-px transition-all duration-100 ${
              pathname.startsWith("/settings")
                ? "bg-surface text-ink font-medium shadow-[0_1px_2px_rgba(40,32,12,0.04)]"
                : "text-ink-2 hover:bg-surface hover:text-ink"
            }`}
          >
            {pathname.startsWith("/settings") && (
              <span className="absolute left-0 top-[7px] bottom-[7px] w-[2px] bg-accent-deep rounded-full" />
            )}
            <span className={`w-4 shrink-0 ${pathname.startsWith("/settings") ? "text-accent-deep" : "text-ink-3"}`}>
              <Settings size={16} />
            </span>
            <span>設定</span>
          </Link>
        </div>

        {/* Roomly Ops（運営者専用・ROOMLY_ADMIN_EMAILSに登録された人だけに表示） */}
        {initialData?.isRoomlyAdmin && (
          <div className="mb-4">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-4 px-6 py-1.5 mb-1">
              Roomly Ops
            </div>
            <Link
              href="/admin/analytics"
              className={`relative flex items-center gap-2.5 py-[7px] px-6 text-[13.5px] rounded-[7px] mx-4 mb-px transition-all duration-100 ${
                pathname.startsWith("/admin/analytics")
                  ? "bg-surface text-ink font-medium shadow-[0_1px_2px_rgba(40,32,12,0.04)]"
                  : "text-ink-2 hover:bg-surface hover:text-ink"
              }`}
            >
              {pathname.startsWith("/admin/analytics") && (
                <span className="absolute left-0 top-[7px] bottom-[7px] w-[2px] bg-accent-deep rounded-full" />
              )}
              <span className={`w-4 shrink-0 ${pathname.startsWith("/admin/analytics") ? "text-accent-deep" : "text-ink-3"}`}>
                <BarChart3 size={16} />
              </span>
              <span>計測ダッシュボード</span>
            </Link>
          </div>
        )}
      </nav>

      {/* ユーザーメニュー */}
      <div ref={userMenuRef} data-user-menu className="relative px-4 py-3 border-t border-line">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-full flex items-center gap-2.5 p-1.5 rounded-[var(--r-md)] hover:bg-surface transition-colors"
        >
          <span className="w-7 h-7 rounded-full bg-surface-2 border border-line grid place-items-center text-[12px] font-semibold text-ink-2 shrink-0">
            {(displayUser.name || displayUser.email || "U").charAt(0).toUpperCase()}
          </span>
          <span className="flex flex-col leading-tight min-w-0 flex-1 text-left">
            <span className="text-[13px] font-medium truncate">{displayUser.name || displayUser.email.split("@")[0] || "ユーザー"}</span>
            <span className="text-[11px] text-ink-3 mt-0.5 truncate">{displayUser.email}</span>
          </span>
          <MoreHorizontal size={14} className="text-ink-3 shrink-0" />
        </button>

        {userMenuOpen && (
          <div className="absolute left-4 right-4 bottom-full mb-2 bg-surface rounded-[var(--r-lg)] border border-line shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-line">
              <div className="text-[12px] font-medium text-ink-2 truncate">{displayUser.name || displayUser.email.split("@")[0] || "ユーザー"}</div>
              <div className="text-[11px] text-ink-4 truncate mt-0.5">{displayUser.email}</div>
            </div>
            <div className="p-2">
              <button
                onClick={() => { logout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-2 hover:bg-danger-tint hover:text-danger rounded-[var(--r-md)] transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                ログアウト
              </button>
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
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-lg bg-surface border border-line text-ink-2 hover:text-ink transition-colors"
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
        className={`fixed left-0 top-0 h-screen bg-bg-2 flex flex-col z-50 md:hidden transition-transform duration-200 border-r border-line ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "var(--sidebar-w)" }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 p-1 rounded text-ink-3 hover:text-ink transition-colors"
        >
          <X size={16} />
        </button>
        {sidebarContent}
      </aside>

      {/* デスクトップ: サイドバー */}
      <aside
        className="fixed left-0 top-0 h-screen bg-bg-2 flex-col z-50 hidden md:flex border-r border-line"
        style={{ width: "var(--sidebar-w)" }}
      >
        {sidebarContent}
      </aside>

      {/* メインコンテンツ */}
      <div className="min-h-screen md:ml-[var(--sidebar-w)]">
        {children}
      </div>
    </>
  );
}
// poll-test
