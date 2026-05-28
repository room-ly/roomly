"use client";

import { useEffect } from "react";

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

const AW_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
const AW_LABEL_DEMO = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_DEMO || "";
const AW_LABEL_SIGNUP = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_SIGNUP || "";

function classify(href: string): "demo" | "signup" | null {
  if (href.includes("demo=1")) return "demo";
  if (/kanri\.roomly\.jp\/signup(\/|\?|$)/.test(href)) return "signup";
  return null;
}

function locationOf(a: HTMLAnchorElement): string {
  return (
    a.closest("[data-section]")?.getAttribute("data-section") ||
    (a.closest("header") ? "header" : a.closest("footer") ? "footer" : "unknown")
  );
}

// 広告流入時のクエリをセッション内で保持する（着地ページ以外でクリックされても引き継げるように）
const SS_KEYS = ["gclid", "utm_source", "utm_medium", "utm_campaign"] as const;
type AdParam = (typeof SS_KEYS)[number];

function captureAdParams() {
  try {
    const here = new URL(window.location.href);
    for (const k of SS_KEYS) {
      const v = here.searchParams.get(k);
      if (v) sessionStorage.setItem(`rm_${k}`, v);
    }
  } catch {
    // sessionStorageが使えない環境では何もしない
  }
}

function readAdParam(k: AdParam): string | null {
  try {
    return sessionStorage.getItem(`rm_${k}`);
  } catch {
    return null;
  }
}

// kanri.roomly.jp へのリンクに広告由来のUTM/gclidを引き継ぐ。
function decorateKanriLink(a: HTMLAnchorElement) {
  try {
    const url = new URL(a.href);
    if (!/(^|\.)kanri\.roomly\.jp$/.test(url.hostname)) return;

    const gclid = readAdParam("gclid");
    const src = readAdParam("utm_source");
    const med = readAdParam("utm_medium");
    const cmp = readAdParam("utm_campaign");

    if (gclid) url.searchParams.set("gclid", gclid);
    // 広告流入と判定: gclid があれば source=google/medium=cpc を既定値で補完
    if (gclid || src) url.searchParams.set("utm_source", src || "google");
    if (gclid || med) url.searchParams.set("utm_medium", med || "cpc");
    if (cmp) url.searchParams.set("utm_campaign", cmp);

    a.href = url.toString();
  } catch {
    // URLパース失敗時は何もしない
  }
}

export function DemoClickTracker() {
  useEffect(() => {
    captureAdParams();

    function handleClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const kind = classify(href);
      if (!kind) return;

      // 広告由来パラメータをkanri側に引き継ぐ（href書き換えはナビゲーション前に行う）
      decorateKanriLink(a);

      const loc = locationOf(a);

      // 既存: サーバ側カウント（demoのみ）
      if (kind === "demo") {
        navigator.sendBeacon(
          "/api/demo-click",
          new Blob([JSON.stringify({ location: loc })], { type: "application/json" })
        );
      }

      // GA4イベント（GA設定済み）
      const eventName = kind === "demo" ? "demo_click" : "signup_click";
      window.gtag?.("event", eventName, {
        location: loc,
        link_url: href,
      });

      // Google広告コンバージョン（AW-IDとラベルが揃っているときだけ）
      const label = kind === "demo" ? AW_LABEL_DEMO : AW_LABEL_SIGNUP;
      if (AW_ID && label) {
        window.gtag?.("event", "conversion", {
          send_to: `${AW_ID}/${label}`,
        });
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
