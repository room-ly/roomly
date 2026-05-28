"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchItem {
  kind: "page" | "tenant" | "property" | "owner";
  label: string;
  sub?: string;
  route: string;
  keywords: string;
}

const ALL_PAGES: SearchItem[] = [
  { kind: "page", label: "ダッシュボード", route: "/", sub: "Workspace", keywords: "ダッシュボード dashboard workspace" },
  { kind: "page", label: "物件", route: "/properties", sub: "Workspace", keywords: "物件 properties workspace" },
  { kind: "page", label: "入居者", route: "/tenants", sub: "Workspace", keywords: "入居者 tenants workspace" },
  { kind: "page", label: "契約", route: "/contracts", sub: "Workspace", keywords: "契約 contracts workspace" },
  { kind: "page", label: "家賃", route: "/rent", sub: "Operations", keywords: "家賃 rent operations" },
  { kind: "page", label: "対応案件", route: "/cases", sub: "Operations", keywords: "対応案件 修繕 鍵 クレーム 騒音 質問 cases maintenance inquiries operations" },
  { kind: "page", label: "経費", route: "/expenses", sub: "Operations", keywords: "経費 expenses operations" },
  { kind: "page", label: "オーナー", route: "/owners", sub: "Finance", keywords: "オーナー owners finance" },
  { kind: "page", label: "送金", route: "/remittances", sub: "Finance", keywords: "送金 remittances finance" },
  { kind: "page", label: "設定", route: "/settings", sub: "System", keywords: "設定 settings system" },
];

const KIND_META: Record<string, { label: string; icon: string }> = {
  page: { label: "ページ", icon: "⌘" },
  tenant: { label: "入居者", icon: "人" },
  property: { label: "物件", icon: "建" },
  owner: { label: "オーナー", icon: "家" },
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return ALL_PAGES.slice(0, 10);
    return ALL_PAGES.filter((i) => i.keywords.includes(query)).slice(0, 30);
  }, [q]);

  const grouped = useMemo(() => {
    const g: Record<string, SearchItem[]> = { page: [], tenant: [], property: [], owner: [] };
    results.forEach((r) => g[r.kind].push(r));
    return g;
  }, [results]);

  const flatList = useMemo(
    () => [...grouped.page, ...grouped.tenant, ...grouped.property, ...grouped.owner],
    [grouped]
  );

  const goTo = useCallback(
    (item: SearchItem) => {
      router.push(item.route);
      setOpen(false);
    },
    [router]
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(flatList.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && flatList[active]) {
      e.preventDefault();
      goTo(flatList[active]);
    }
  };

  useEffect(() => { setActive(0); }, [q]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  let runningIdx = -1;

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <span className="cmdk-input-icon"><Search size={16} /></span>
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="ページ・入居者・物件・オーナーを検索..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
          />
          <kbd className="cmdk-input-esc">ESC</kbd>
        </div>

        <div className="cmdk-results" ref={listRef}>
          {flatList.length === 0 ? (
            <div className="cmdk-empty">該当する結果がありません</div>
          ) : (
            (["page", "tenant", "property", "owner"] as const).map((kind) => {
              if (!grouped[kind].length) return null;
              return (
                <div key={kind} className="cmdk-group">
                  <div className="cmdk-group-label mono">{KIND_META[kind].label}</div>
                  {grouped[kind].map((item) => {
                    runningIdx++;
                    const isActive = runningIdx === active;
                    const idx = runningIdx;
                    return (
                      <div
                        key={item.route}
                        data-idx={idx}
                        className={`cmdk-item ${isActive ? "is-active" : ""}`}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => goTo(item)}
                      >
                        <span className={`cmdk-item-icon kind-${item.kind} mono`}>
                          {KIND_META[item.kind].icon}
                        </span>
                        <div className="cmdk-item-body">
                          <div className="cmdk-item-label">{item.label}</div>
                          {item.sub && <div className="cmdk-item-sub">{item.sub}</div>}
                        </div>
                        <span className="cmdk-item-arrow mono">↵</span>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="cmdk-foot mono">
          <span><kbd>↑</kbd><kbd>↓</kbd> 移動</span>
          <span><kbd>↵</kbd> 開く</span>
          <span><kbd>esc</kbd> 閉じる</span>
        </div>
      </div>
    </div>
  );
}
