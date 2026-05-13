"use client";

import { Play } from "lucide-react";

function trackDemo(location: string) {
  fetch("/api/demo-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location }),
  }).catch(() => {});
}

export function DemoButtonHero() {
  return (
    <a
      href="https://roomly.jp/login?demo=1"
      onClick={() => trackDemo("hero")}
      className="inline-flex items-center gap-2 rounded border border-white/30 px-8 py-3.5 text-[15px] font-medium text-white/90 transition-colors hover:bg-white/10 hover:border-white/50"
    >
      <Play size={14} />
      デモを試す
    </a>
  );
}

export function DemoButtonPricing() {
  return (
    <>
      <a
        href="https://roomly.jp/login?demo=1"
        onClick={() => trackDemo("pricing")}
        className="mt-3 flex items-center justify-center gap-2 rounded border border-rm-border py-3 text-[13px] font-medium text-rm-text-secondary transition-colors hover:bg-rm-bg"
      >
        <Play size={13} />
        デモを試す（登録不要）
      </a>
      <p className="mt-2 text-center text-[11px] text-rm-text-muted">
        ID: demo@roomly.jp / PW: demo1234
      </p>
    </>
  );
}
