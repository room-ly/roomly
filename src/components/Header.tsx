"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  LogOut,
  User,
  Settings,
  X,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";

// パンくず定義
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

// 通知データ（モック）
const notifications = [
  { id: 1, title: "家賃滞納: 田中太郎", time: "5分前", type: "danger" as const },
  { id: 2, title: "修繕依頼: エアコン故障", time: "30分前", type: "warning" as const },
  { id: 3, title: "契約更新: 佐藤花子", time: "1時間前", type: "info" as const },
];

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // ドロップダウンの外側クリックで閉じる
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

  // パンくずの生成
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
    <header className="h-16 bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
      {/* 左: パンくず */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0 ml-10 md:ml-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight size={14} className="text-text-muted shrink-0" />}
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

      {/* 右: アクション */}
      <div className="flex items-center gap-1">
        {/* 検索 */}
        {searchOpen ? (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              autoFocus
              type="text"
              placeholder="物件・入居者を検索..."
              className="input pl-10 pr-8 py-1.5 w-64 text-sm"
              onBlur={() => setSearchOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-secondary transition-colors"
            title="検索"
          >
            <Search size={18} />
          </button>
        )}

        {/* ダークモード切替 */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-secondary transition-colors"
          title={theme === "dark" ? "ライトモード" : "ダークモード"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* 通知 */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-secondary transition-colors relative"
            title="通知"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-xl border border-border shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm">通知</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="px-4 py-3 hover:bg-bg-secondary transition-colors border-b border-border-light cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          n.type === "danger"
                            ? "bg-danger"
                            : n.type === "warning"
                            ? "bg-warning"
                            : "bg-accent"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 text-center">
                <button className="text-xs text-accent hover:underline">すべて見る</button>
              </div>
            </div>
          )}
        </div>

        {/* ユーザーメニュー */}
        <div ref={userRef} className="relative ml-1">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-secondary transition-colors"
          >
            <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0) || "U"}
            </div>
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="font-semibold text-sm">{user?.name || "ユーザー"}</p>
                <p className="text-xs text-text-muted mt-0.5">{user?.email || ""}</p>
              </div>
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-secondary transition-colors">
                  <User size={16} />
                  プロフィール
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-secondary transition-colors">
                  <Settings size={16} />
                  設定
                </button>
              </div>
              <div className="border-t border-border py-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger-bg transition-colors"
                >
                  <LogOut size={16} />
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
