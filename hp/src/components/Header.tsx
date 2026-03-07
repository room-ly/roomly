"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

const NAV_ITEMS = [
  { label: "ホーム", href: "/" },
  { label: "機能", href: "/features" },
  { label: "料金", href: "/pricing" },
  { label: "導入事例", href: "/case-studies" },
  { label: "FAQ", href: "/faq" },
  { label: "コラム", href: "/column" },
  { label: "お問い合わせ", href: "/contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-rm-border bg-rm-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-rm-primary">
          Roomly
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-rm-text-secondary transition-colors hover:text-rm-primary"
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{ background: theme === "dark" ? "var(--rm-accent)" : "var(--rm-border)" }}
            title={theme === "dark" ? "ライトモード" : "ダークモード"}
            aria-label="テーマ切り替え"
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
              style={{ transform: theme === "dark" ? "translateX(16px)" : "translateX(0)" }}
            />
          </button>
          <a
            href="https://roomly.jp"
            className="rounded bg-rm-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-rm-accent-light"
          >
            ログイン
          </a>
        </nav>

        <div className="flex items-center gap-3 sm:hidden">
          <button
            onClick={toggleTheme}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{ background: theme === "dark" ? "var(--rm-accent)" : "var(--rm-border)" }}
            title={theme === "dark" ? "ライトモード" : "ダークモード"}
            aria-label="テーマ切り替え"
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
              style={{ transform: theme === "dark" ? "translateX(16px)" : "translateX(0)" }}
            />
          </button>
          <button
            className="text-rm-text-secondary"
            onClick={() => setOpen(!open)}
            aria-label="メニュー"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-rm-border bg-rm-surface px-4 pb-4 sm:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm text-rm-text-secondary transition-colors hover:text-rm-primary"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://roomly.jp"
            className="mt-2 block rounded bg-rm-accent py-2.5 text-center text-sm font-medium text-white"
          >
            ログイン
          </a>
        </nav>
      )}
    </header>
  );
}
