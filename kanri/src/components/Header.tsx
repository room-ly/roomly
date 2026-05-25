"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { createClient } from "@/lib/supabase";

const breadcrumbMap: Record<string, string> = {
  "/": "ダッシュボード",
  "/properties": "物件",
  "/tenants": "入居者",
  "/contracts": "契約",
  "/rent": "家賃",
  "/maintenance": "修繕",
  "/inquiries": "問い合わせ",
  "/expenses": "経費",
  "/owners": "オーナー",
  "/remittances": "送金",
  "/payments": "支払い出力",
  "/payees": "支払先",
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
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [pathname, fetchNotifications]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as Notification;
          setNotifications((prev) => [row, ...prev].slice(0, 20));
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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

  const handleNotifClick = (n: Notification) => {
    if (!n.is_read) {
      fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      });
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (n.link) {
      setNotifOpen(false);
      router.push(n.link);
    }
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  const crumbs = segments
    .filter((seg) => !isUuid(seg))
    .map((seg, i, arr) => {
      const href = "/" + arr.slice(0, i + 1).join("/");
      const segMap: Record<string, string> = { units: "部屋" };
      return breadcrumbMap[href] || segMap[seg] || decodeURIComponent(seg);
    });
  if (crumbs.length === 0) crumbs.push("ダッシュボード");

  return (
    <header className="topbar">
      {/* パンくず */}
      <nav className="crumbs" style={{ marginLeft: 40 }}>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? "now" : ""}>
              {c}
            </span>
          </span>
        ))}
      </nav>

{/* アクション */}
      <div className="topbar-actions">
        {/* テーマ切替 */}
        <button
          onClick={toggleTheme}
          className="icon-btn"
          aria-label="テーマ切り替え"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* 通知 */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="icon-btn"
            aria-label="通知"
          >
            <Bell size={16} />
            {unreadCount > 0 && <span className="dot" />}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-[min(288px,calc(100vw-2rem))] bg-surface rounded-[var(--r-lg)] border border-line shadow-lg overflow-hidden z-50">
              <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
                <h3 className="font-medium text-[13px]">通知</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-accent-deep hover:underline">
                    全て既読
                  </button>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-ink-3">通知はありません</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`px-4 py-2.5 hover:bg-surface-2 transition-colors border-b border-line cursor-pointer ${
                        !n.is_read ? "bg-accent-tint/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                            n.type === "danger"
                              ? "bg-danger"
                              : n.type === "warning"
                              ? "bg-warn"
                              : "bg-accent"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate">{n.title}</p>
                          <p className="text-[11px] text-ink-3 mt-0.5">{formatTimeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
