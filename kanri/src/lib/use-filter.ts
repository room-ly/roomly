// 汎用フィルタ・検索・ページネーションフック
import { useState, useMemo } from "react";

interface UseFilterOptions<T> {
  items: T[];
  searchFields: (keyof T | string)[];
  pageSize?: number;
}

// ネストされたプロパティの取得（"contract.tenant.name" のような形式に対応）
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function useFilter<T extends Record<string, any>>({
  items,
  searchFields,
  pageSize = 20,
}: UseFilterOptions<T>) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string>("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...items];

    // テキスト検索
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = getNestedValue(item, field as string);
          return value && String(value).toLowerCase().includes(q);
        })
      );
    }

    // フィルタ
    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== "all") {
        result = result.filter((item) => {
          const v = getNestedValue(item, key);
          return v === value;
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
  }, [items, search, filters, sortKey, sortAsc, searchFields]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return {
    search,
    setSearch: (v: string) => { setSearch(v); setPage(1); },
    filters,
    setFilter,
    sortKey,
    sortAsc,
    toggleSort,
    page,
    setPage,
    totalPages,
    totalFiltered: filtered.length,
    items: paged,
  };
}
