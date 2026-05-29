"use client";

import { useEffect } from "react";

// アフィリエイトコードはlocalStorageで90日間保持し、kanri/signup遷移時に
// rm_aff / rm_vid パラメータで引き継ぐ。
const LS_AFF_KEY = "roomly_aff";
const LS_VID_KEY = "roomly_visitor_id";
const LS_AFF_TS_KEY = "roomly_aff_ts";
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

function generateVisitorId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // フォールバック
  return "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readVisitorId(): string {
  try {
    let v = localStorage.getItem(LS_VID_KEY);
    if (!v) {
      v = generateVisitorId();
      localStorage.setItem(LS_VID_KEY, v);
    }
    return v;
  } catch {
    return generateVisitorId();
  }
}

function readActiveAff(): string | null {
  try {
    const code = localStorage.getItem(LS_AFF_KEY);
    const ts = parseInt(localStorage.getItem(LS_AFF_TS_KEY) || "0", 10);
    if (!code) return null;
    if (!ts || Date.now() - ts > TTL_MS) {
      localStorage.removeItem(LS_AFF_KEY);
      localStorage.removeItem(LS_AFF_TS_KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

function persistAff(code: string) {
  try {
    localStorage.setItem(LS_AFF_KEY, code);
    localStorage.setItem(LS_AFF_TS_KEY, Date.now().toString());
  } catch {
    // ignore
  }
}

async function recordClick(code: string, visitorId: string) {
  try {
    await fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        code,
        visitor_id: visitorId,
        landing_path: window.location.pathname + window.location.search,
        referrer: document.referrer || null,
      }),
    });
  } catch {
    // 計測失敗は致命的でないので握りつぶす
  }
}

// kanri.roomly.jp へのリンクにアフィリエイトコード/visitor_idを引き継ぐ
function decorateKanriLink(a: HTMLAnchorElement, code: string, visitorId: string) {
  try {
    const url = new URL(a.href);
    if (!/(^|\.)kanri\.roomly\.jp$/.test(url.hostname)) return;
    url.searchParams.set("rm_aff", code);
    url.searchParams.set("rm_vid", visitorId);
    a.href = url.toString();
  } catch {
    // ignore
  }
}

export function AffiliateTracker() {
  useEffect(() => {
    // 1. URLに ?ref= があれば最新コードを保存し、クリックログを記録
    let activeCode: string | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && /^[A-Z0-9]{4,16}$/.test(ref)) {
        persistAff(ref);
        activeCode = ref;
        const vid = readVisitorId();
        recordClick(ref, vid);
      }
    } catch {
      // ignore
    }

    if (!activeCode) activeCode = readActiveAff();
    if (!activeCode) return;

    const code = activeCode;
    const visitorId = readVisitorId();

    // 2. kanriへのリンクにアフィリエイトコードを乗せる
    function handleClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      decorateKanriLink(a, code, visitorId);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
