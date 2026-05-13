"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  BarChart3,
  Menu,
  X,
  LogOut,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

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
      { href: "/maintenance", label: "修繕", icon: Wrench },
      { href: "/expenses", label: "経費", icon: Receipt },
      { href: "/inquiries", label: "問い合わせ", icon: MessageSquare },
    ] as NavItem[],
  },
  {
    group: "Finance",
    items: [
      { href: "/owners", label: "オーナー", icon: UserCircle },
      { href: "/remittances", label: "送金", icon: Send },
      { href: "/reports", label: "レポート", icon: BarChart3 },
    ] as NavItem[],
  },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});
  const [companyName, setCompanyName] = useState<string>("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/badge-counts")
      .then((res) => res.json())
      .then((data) => {
        const { company_name, ...counts } = data;
        setBadgeCounts(counts);
        if (company_name) setCompanyName(company_name);
      })
      .catch(() => {});
  }, [pathname]);

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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getBadgeKind = (href: string): string | undefined => {
    if (href === "/rent") return "danger";
    if (href === "/contracts") return "warn";
    return undefined;
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
                    {badge && badge > 0 && (
                      <span className={`font-mono text-[10px] px-1.5 py-px rounded-full border ${
                        badgeKind === "danger"
                          ? "bg-danger-tint text-danger border-transparent"
                          : badgeKind === "warn"
                          ? "bg-warn-tint text-warn border-transparent"
                          : "bg-bg text-ink-2 border-line"
                      }`}>
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
      </nav>

      {/* ユーザーメニュー */}
      <div ref={userMenuRef} className="relative px-4 py-3 border-t border-line">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-full flex items-center gap-2.5 p-1.5 rounded-[var(--r-md)] hover:bg-surface transition-colors"
        >
          <span className="w-7 h-7 rounded-full bg-surface-2 border border-line grid place-items-center text-[12px] font-semibold text-ink-2 shrink-0">
            {user?.name?.charAt(0) || "U"}
          </span>
          <span className="flex flex-col leading-tight min-w-0 flex-1 text-left">
            <span className="text-[13px] font-medium truncate">{user?.name || "ユーザー"}</span>
            <span className="text-[11px] text-ink-3 mt-0.5 truncate">{user?.email || ""}</span>
          </span>
          <MoreHorizontal size={14} className="text-ink-3 shrink-0" />
        </button>

        {userMenuOpen && (
          <div className="absolute left-4 right-4 bottom-full mb-1.5 bg-surface rounded-[var(--r-lg)] border border-line shadow-lg z-50">
            <div className="py-0.5">
              <button
                onClick={() => { setUserMenuOpen(false); router.push("/settings"); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-ink-2 hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <Settings size={14} />
                設定
              </button>
              <button
                onClick={() => { setUserMenuOpen(false); setDeleteConfirm(true); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-ink-2 hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                アカウント削除
              </button>
            </div>
            <div className="border-t border-line py-0.5">
              <button
                onClick={() => { logout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-danger hover:bg-danger-tint transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                ログアウト
              </button>
            </div>
          </div>
        )}
      </div>

      {/* アカウント削除確認モーダル */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(false)}>
          <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h2 className="text-[15px] font-semibold mb-3">アカウントの削除</h2>
            <p className="text-[13px] text-ink-2 mb-2">
              自分のアカウントを削除しますか？<br />
              ログアウトされ、以後このアカウントではログインできなくなります。
            </p>
            <p className="text-[12px] text-ink-3 mb-5">
              データは保持されます。復元が必要な場合はお問い合わせください。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={async () => {
                  if (!user) return;
                  setDeleting(true);
                  const res = await fetch("/api/users", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.id }),
                  });
                  if (res.ok) {
                    logout();
                  } else {
                    const err = await res.json();
                    alert(err.error || "削除に失敗しました");
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="bg-danger text-white rounded-lg px-4 py-2 text-sm hover:bg-danger/90 transition-colors disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
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
