"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Users, BarChart3, LogOut, Megaphone, MapPin, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

const NAV = [
  { href: "/affiliates", label: "アフィリエイト", icon: Users },
  { href: "/usage", label: "稼働状況", icon: Activity },
  { href: "/analytics", label: "計測ダッシュボード", icon: BarChart3 },
  { href: "/marketing", label: "マーケティング", icon: Megaphone },
  { href: "/whereami", label: "現在地", icon: MapPin },
];

export default function AdminLayout({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-line bg-surface flex flex-col">
        <div className="px-5 py-4 border-b border-line">
          <div className="text-[15px] font-semibold">Roomly Admin</div>
          <div className="text-[10px] tracking-wider uppercase text-ink-3 mt-0.5">
            運営者専用
          </div>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mx-2 mb-1 flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-bg text-ink font-medium"
                    : "text-ink-2 hover:bg-bg"
                }`}
              >
                <Icon size={16} className={active ? "text-accent" : "text-ink-3"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-line">
          <div className="text-[11px] text-ink-3 mb-2 truncate" title={email}>
            {email}
          </div>
          <button
            onClick={signOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-ink-2 hover:bg-bg transition-colors disabled:opacity-50"
          >
            <LogOut size={13} />
            {signingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto">{children}</main>
    </div>
  );
}
