"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

const NAV_ITEMS = [
  { label: "ホーム", href: "/" },
  { label: "機能", href: "/features" },
  { label: "料金", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "コラム", href: "/column" },
  { label: "お問い合わせ", href: "/contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-[border-color,background] duration-200 ${
        scrolled
          ? "border-b border-rm-border bg-rm-bg/88 backdrop-blur-[14px]"
          : "border-b border-transparent bg-rm-bg/88 backdrop-blur-[14px]"
      }`}
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-7 h-16">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-[17px] tracking-tight text-rm-primary">
          <span className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-rm-primary text-rm-bg font-serif-display text-[17px] italic">
            R
          </span>
          <span>Roomly</span>
        </Link>

        <nav className="hidden items-center gap-7 sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[14px] text-rm-text-secondary transition-colors hover:text-rm-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 sm:flex">
          <button
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rm-border-strong text-rm-text-secondary transition-colors hover:bg-rm-surface"
            aria-label="テーマ切り替え"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a
            href="https://roomly.jp/login?demo=1"
            className="inline-flex h-10 items-center rounded-full border border-rm-border-strong px-[18px] text-[14px] font-medium text-rm-primary transition-colors hover:bg-rm-surface"
          >
            デモを試す
          </a>
          <a
            href="https://roomly.jp/signup"
            className="inline-flex h-10 items-center rounded-full bg-rm-primary px-[18px] text-[14px] font-medium text-rm-bg transition-colors hover:bg-rm-accent-deep hover:text-white"
          >
            無料で始める
          </a>
        </div>

        <div className="flex items-center gap-3 sm:hidden">
          <button
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rm-border-strong text-rm-text-secondary"
            aria-label="テーマ切り替え"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
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
        <nav className="border-t border-rm-border bg-rm-bg px-7 pb-4 sm:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-[14px] text-rm-text-secondary transition-colors hover:text-rm-primary"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2">
            <a
              href="https://roomly.jp/login?demo=1"
              className="flex-1 rounded-full border border-rm-border-strong py-2.5 text-center text-[14px] font-medium text-rm-primary"
            >
              デモを試す
            </a>
            <a
              href="https://roomly.jp/signup"
              className="flex-1 rounded-full bg-rm-primary py-2.5 text-center text-[14px] font-medium text-rm-bg"
            >
              無料で始める
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
