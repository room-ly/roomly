"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  User,
  Settings,
  X,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";

const breadcrumbMap: Record<string, string> = {
  "/": "ダッシュボード",
  "/properties": "物件管理",
  "/tenants": "入居者管理",
  "/contracts": "契約管理",
  "/rent": "家賃管理",
  "/maintenance": "修繕管理",
  "/inquiries": "問い合わせ",
  "/owners": "オーナー管理",
  "/settings": "設定",
};

interface Notification {
  id: string;
  title: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {});
  }, [pathname]);

  const markAllRead = () => {
    fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).then(() => {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    });
  };
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [
    { label: "ホーム", href: "/" },
    ...segments.map((seg, i) => {
      const href = "/" + segments.slice(0, i + 1).join("/");
      const label = breadcrumbMap[href] || decodeURIComponent(seg);
      return { label, href };
    }),
  ];

  return (
    <header className="h-14 bg-card border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
      {/* パンくず */}
      <nav className="flex items-center gap-1 text-[13px] min-w-0 ml-10 md:ml-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight size={12} className="text-text-muted shrink-0" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-text truncate">{crumb.label}</span>
            ) : (
              <span className="text-text-muted hover:text-text-secondary transition-colors truncate cursor-default">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* アクション */}
      <div className="flex items-center gap-0.5">
        {searchOpen ? (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              autoFocus
              type="text"
              placeholder="物件・入居者を検索..."
              className="input pl-9 pr-8 py-1.5 w-56 text-[13px]"
              onBlur={() => setSearchOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded text-text-muted hover:text-text hover:bg-bg-secondary transition-colors"
            title="検索"
          >
            <Search size={16} />
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="relative w-9 h-5 rounded-full transition-colors"
          style={{ background: theme === "dark" ? "var(--accent)" : "var(--border)" }}
          title={theme === "dark" ? "ライトモード" : "ダークモード"}
          aria-label="テーマ切り替え"
        >
          <span
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
            style={{ transform: theme === "dark" ? "translateX(16px)" : "translateX(0)" }}
          />
        </button>

        {/* 通知 */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className="p-2 rounded text-text-muted hover:text-text hover:bg-bg-secondary transition-colors relative"
            title="通知"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center px-0.5 text-[9px] font-medium rounded-full bg-danger text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-card rounded border border-border shadow-md overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                <h3 className="font-medium text-[13px]">通知</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-accent hover:underline">
                    全て既読
                  </button>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-text-muted">通知はありません</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-2.5 hover:bg-bg-secondary transition-colors border-b border-border-light cursor-pointer ${
                        !n.is_read ? "bg-accent-subtle/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                            n.type === "danger"
                              ? "bg-danger"
                              : n.type === "warning"
                              ? "bg-warning"
                              : "bg-accent"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate">{n.title}</p>
                          <p className="text-[11px] text-text-muted mt-0.5">{formatTimeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ユーザー */}
        <div ref={userRef} className="relative ml-1">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 p-1 rounded hover:bg-bg-secondary transition-colors"
          >
            <div className="w-7 h-7 rounded bg-accent/10 flex items-center justify-center text-accent text-[12px] font-semibold">
              {user?.name?.charAt(0) || "U"}
            </div>
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-card rounded border border-border shadow-md overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="font-medium text-[13px]">{user?.name || "ユーザー"}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{user?.email || ""}</p>
              </div>
              <div className="py-0.5">
                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-text-secondary hover:bg-bg-secondary transition-colors">
                  <User size={14} />
                  プロフィール
                </button>
                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-text-secondary hover:bg-bg-secondary transition-colors">
                  <Settings size={14} />
                  設定
                </button>
              </div>
              <div className="border-t border-border py-0.5">
                <button
                  onClick={async () => { await logout(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-danger hover:bg-danger-bg transition-colors"
                >
                  <LogOut size={14} />
                  ログアウト
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
