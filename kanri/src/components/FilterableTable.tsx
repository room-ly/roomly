"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  render?: (item: Record<string, any>) => React.ReactNode;
}

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterableTableProps {
  data: Record<string, any>[];
  columns: Column[];
  searchFields?: string[];
  searchPlaceholder?: string;
  filters?: FilterOption[];
  initialFilters?: Record<string, string>;
  // フィルタ行に並べる追加UI（親が state を持つフィルタ。例: テーブル/カンバン共通の優先度フィルタ）
  extraFilters?: React.ReactNode;
  pageSize?: number;
  rowClassName?: (item: Record<string, any>) => string;
  onRowClick?: (item: Record<string, any>) => void;
  emptyMessage?: string;
  actions?: (item: Record<string, any>) => React.ReactNode;
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export default function FilterableTable({
  data,
  columns,
  searchFields = [],
  searchPlaceholder = "検索...",
  filters = [],
  initialFilters = {},
  extraFilters,
  pageSize = 20,
  rowClassName,
  onRowClick,
  emptyMessage = "データがありません",
  actions,
}: FilterableTableProps) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(initialFilters);
  const [sortKey, setSortKey] = useState<string>("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...data];

    // テキスト検索
    if (search && searchFields.length > 0) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = getNestedValue(item, field);
          return value && String(value).toLowerCase().includes(q);
        })
      );
    }

    // フィルタ
    for (const [key, value] of Object.entries(filterValues)) {
      if (value && value !== "all") {
        result = result.filter((item) => {
          const v = getNestedValue(item, key);
          return String(v) === value;
        });
      }
    }

    // ソート
    if (sortKey) {
      result.sort((a, b) => {
        const va = getNestedValue(a, sortKey);
        const vb = getNestedValue(b, sortKey);
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortAsc ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, filterValues, sortKey, sortAsc, searchFields]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <>
      {/* 検索バー + フィルタ */}
      {(searchFields.length > 0 || filters.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {searchFields.length > 0 && (
            <div className="relative" style={{ flex: "1 1 0", minWidth: 180, maxWidth: 320 }}>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={searchPlaceholder}
                className="input w-full"
                style={{ paddingLeft: "2.25rem" }}
              />
            </div>
          )}
          {filters.map((f) => (
            <select
              key={f.key}
              value={filterValues[f.key] || "all"}
              onChange={(e) => {
                setFilterValues((prev) => ({ ...prev, [f.key]: e.target.value }));
                setPage(1);
              }}
              className="input"
              style={{ width: "auto", minWidth: 120 }}
            >
              <option value="all">{f.label}: すべて</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}
          {extraFilters}
          {search || Object.values(filterValues).some((v) => v && v !== "all") ? (
            <span className="text-[12px] text-ink-3">
              {filtered.length}件
            </span>
          ) : null}
        </div>
      )}

      {/* テーブル */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="text-left text-ink-3 border-b border-line">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 sm:px-5 py-2.5 font-medium whitespace-nowrap ${
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""
                    } ${col.sortable ? "cursor-pointer select-none hover:text-ink transition-colors" : ""}`}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <ArrowUpDown size={11} className={sortKey === col.key ? "text-accent" : "opacity-30"} />
                      )}
                    </span>
                  </th>
                ))}
                {actions && <th className="px-3 py-2.5 font-medium w-12 sticky right-0 bg-inherit"></th>}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-8 text-center text-ink-3">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className={`border-b border-line last:border-0 hover:bg-bg-2/30 transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    } ${rowClassName?.(item) || ""}`}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3 sm:px-5 py-2.5 whitespace-nowrap ${
                          col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""
                        }`}
                      >
                        {col.render ? col.render(item) : getNestedValue(item, col.key) ?? "—"}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-3 py-2.5 sticky right-0 bg-inherit" onClick={(e) => e.stopPropagation()}>
                        {actions(item)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-[12px] sm:text-[13px]">
          <span className="text-ink-3 hidden sm:inline">
            {filtered.length}件中 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)}件
          </span>
          <span className="text-ink-3 sm:hidden">
            {page}/{totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded hover:bg-bg-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded text-[12px] transition-colors ${
                    pageNum === page ? "bg-accent text-white" : "hover:bg-bg-2 text-ink-2"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded hover:bg-bg-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
