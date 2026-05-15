"use client";

import { useEffect } from "react";

export function DemoClickTracker() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!href.includes("demo=1")) return;

      const loc =
        a.closest("[data-section]")?.getAttribute("data-section") ||
        (a.closest("header") ? "header" : a.closest("footer") ? "footer" : "unknown");

      navigator.sendBeacon(
        "/api/demo-click",
        new Blob([JSON.stringify({ location: loc })], { type: "application/json" })
      );
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
