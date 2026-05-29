"use client";

import { useEffect } from "react";

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

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
const SS_KEYS = [
  "gclid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;
type AdParam = (typeof SS_KEYS)[number];
const SS_REFERRER_KEY = "rm_referrer";
const SS_LANDING_KEY = "rm_landing_path";

function captureAdParams() {
  try {
    const here = new URL(window.location.href);
    for (const k of SS_KEYS) {
      const v = here.searchParams.get(k);
      if (v) sessionStorage.setItem(`rm_${k}`, v);
    }
    // 外部からの初回着地時の referrer と landing_path を保持
    if (!sessionStorage.getItem(SS_REFERRER_KEY)) {
      const ref = document.referrer || "";
      // 自サイト遷移は無視
      if (ref && !/(^|\.)roomly\.jp$/.test(new URL(ref).hostname)) {
        sessionStorage.setItem(SS_REFERRER_KEY, ref);
      }
    }
    if (!sessionStorage.getItem(SS_LANDING_KEY)) {
      sessionStorage.setItem(
        SS_LANDING_KEY,
        window.location.pathname + window.location.search
      );
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

function readSession(k: string): string | null {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}

// kanri.roomly.jp へのリンクに広告由来のUTM/gclid/referrerを引き継ぐ。
function decorateKanriLink(a: HTMLAnchorElement) {
  try {
    const url = new URL(a.href);
    if (!/(^|\.)kanri\.roomly\.jp$/.test(url.hostname)) return;

    const gclid = readAdParam("gclid");
    const src = readAdParam("utm_source");
    const med = readAdParam("utm_medium");
    const cmp = readAdParam("utm_campaign");
    const term = readAdParam("utm_term");
    const content = readAdParam("utm_content");
    const referrer = readSession(SS_REFERRER_KEY);
    const landing = readSession(SS_LANDING_KEY);

    if (gclid) url.searchParams.set("gclid", gclid);
    // 広告流入と判定: gclid があれば source=google/medium=cpc を既定値で補完
    if (gclid || src) url.searchParams.set("utm_source", src || "google");
    if (gclid || med) url.searchParams.set("utm_medium", med || "cpc");
    if (cmp) url.searchParams.set("utm_campaign", cmp);
    if (term) url.searchParams.set("utm_term", term);
    if (content) url.searchParams.set("utm_content", content);
    // kanri側で読み取ってlocalStorageに保存（先頭"rm_"はクライアント側で除去）
    if (referrer) url.searchParams.set("rm_ref", referrer);
    if (landing) url.searchParams.set("rm_landing", landing);

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

      // GA4カスタムイベント（Google広告のCVはGA4経由で連携）
      const eventName = kind === "demo" ? "demo_click" : "signup_click";
      window.gtag?.("event", eventName, {
        location: loc,
        link_url: href,
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
