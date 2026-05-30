"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";

const POLL_INTERVAL_MS = 60_000;

async function fetchBuildId(): Promise<string | null> {
  try {
    const res = await fetch("/api/version", { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { buildId?: string };
    return json.buildId ?? null;
  } catch {
    return null;
  }
}

function isUserBusy(): boolean {
  if (typeof document === "undefined") return false;

  // 編集中の入力欄にフォーカスがある
  const active = document.activeElement as HTMLElement | null;
  if (active) {
    const tag = active.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (active.isContentEditable) return true;
  }

  // モーダル系（role=dialog、または fixed inset-0 のオーバーレイ）
  if (document.querySelector('[role="dialog"]')) return true;
  const overlays = document.querySelectorAll<HTMLElement>(".fixed.inset-0");
  for (const el of overlays) {
    if (el.offsetParent !== null || el.getClientRects().length > 0) return true;
  }

  return false;
}

export default function VersionWatcher() {
  const initialBuildId = useRef<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const check = async () => {
      const current = await fetchBuildId();
      if (cancelled || !current) return;
      if (initialBuildId.current === null) {
        initialBuildId.current = current;
        return;
      }
      if (current !== initialBuildId.current) {
        setUpdateAvailable(true);
      }
    };

    check();
    timer = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  // タブが非アクティブになった瞬間にサイレントリロード
  useEffect(() => {
    if (!updateAvailable) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isUserBusy()) {
        window.location.reload();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [updateAvailable]);

  if (!updateAvailable || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-lg text-[13px] text-ink-2 max-w-[360px]"
    >
      <RefreshCw size={16} className="text-accent shrink-0" />
      <div className="flex-1 leading-relaxed">
        新しいバージョンが利用可能です。
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-white text-[12px] hover:opacity-90 transition-opacity"
      >
        更新する
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="閉じる"
        className="shrink-0 text-ink-3 hover:text-ink transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
