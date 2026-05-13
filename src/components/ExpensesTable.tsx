"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpDown } from "lucide-react";
import MonthSelector from "./MonthSelector";
import StatusBadge from "./StatusBadge";
import RowMenu from "./RowMenu";
import ExpenseFormModal from "./ExpenseFormModal";

interface SelectOption {
  id: string;
  label: string;
  owner_id?: string;
}

interface ExpensesTableProps {
  data: Record<string, any>[];
  properties: SelectOption[];
  owners: SelectOption[];
}

function getAvailableMonths(data: Record<string, any>[]): string[] {
  const set = new Set<string>();
  for (const item of data) {
    if (item.expense_date) set.add(item.expense_date.slice(0, 7));
  }
  return Array.from(set).sort().reverse();
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function ExpensesTable({ data, properties, owners }: ExpensesTableProps) {
  const router = useRouter();
  const [editData, setEditData] = useState<Record<string, any> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const availableMonths = useMemo(() => getAvailableMonths(data), [data]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const current = getCurrentMonth();
    return availableMonths.includes(current) ? current : availableMonths[0] || current;
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [chargeFilter, setChargeFilter] = useState("all");
  const [sortKey, setSortKey] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const monthFiltered = useMemo(() => {
    if (selectedMonth === "all") return data;
    return data.filter((e) => e.expense_date?.startsWith(selectedMonth));
  }, [data, selectedMonth]);

  const filtered = useMemo(() => {
    let result = [...monthFiltered];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.description?.toLowerCase().includes(q) ||
          item.property?.name?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") result = result.filter((item) => item.category === categoryFilter);
    if (chargeFilter !== "all") result = result.filter((item) => String(item.is_owner_charge) === chargeFilter);
    if (sortKey) {
      result.sort((a, b) => {
        const va = sortKey.includes(".") ? sortKey.split(".").reduce((o: any, k) => o?.[k], a) : a[sortKey];
        const vb = sortKey.includes(".") ? sortKey.split(".").reduce((o: any, k) => o?.[k], b) : b[sortKey];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        return sortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
      });
    }
    return result;
  }, [monthFiltered, search, categoryFilter, chargeFilter, sortKey, sortAsc]);

  const totalAmount = monthFiltered.reduce((s, e) => s + Number(e.amount), 0);
  const ownerChargeAmount = monthFiltered.filter((e) => e.is_owner_charge).reduce((s, e) => s + Number(e.amount), 0);
  const companyChargeAmount = totalAmount - ownerChargeAmount;
  const byCategory = monthFiltered.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  async function handleDelete(item: Record<string, any>) {
    if (!confirm("この経費を削除しますか？")) return;
    const res = await fetch(`/api/expenses/${item.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("削除に失敗しました");
  }

  const monthLabel = selectedMonth === "all"
    ? "全期間"
    : `${Number(selectedMonth.slice(0, 4))}年${Number(selectedMonth.slice(5, 7))}月`;

  const cols = [
    { key: "expense_date", label: "日付", sortable: true },
    { key: "category", label: "カテゴリ" },
    { key: "description", label: "内容" },
    { key: "property.name", label: "物件" },
    { key: "unit.unit_number", label: "部屋" },
    { key: "amount", label: "金額", sortable: true, align: "right" as const },
    { key: "is_owner_charge", label: "負担" },
  ];

  return (
    <>
      <MonthSelector selectedMonth={selectedMonth} availableMonths={availableMonths} onChange={setSelectedMonth} />

      {/* サマリー */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">経費総額</p>
          <p className="text-xl font-semibold tabular-nums">¥{totalAmount.toLocaleString()}</p>
        </div>
        <div className="card p-4 border-l-[3px] border-l-warn">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">オーナー負担</p>
          <p className="text-xl font-semibold text-warn tabular-nums">¥{ownerChargeAmount.toLocaleString()}</p>
          <p className="text-[11px] text-ink-3 mt-0.5">送金時に控除</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">管理会社負担</p>
          <p className="text-xl font-semibold text-accent tabular-nums">¥{companyChargeAmount.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-2">登録件数</p>
          <p className="text-xl font-semibold tabular-nums">{monthFiltered.length}件</p>
        </div>
      </div>

      {/* カテゴリ別内訳 */}
      {Object.keys(byCategory).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {Object.entries(byCategory).map(([cat, amount]) => (
            <div key={cat} className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface shadow-sm text-[12px]">
              <StatusBadge status={cat} />
              <span className="font-medium tabular-nums">¥{amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* 検索・フィルタ */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="内容・物件名で検索..." className="input w-full" style={{ paddingLeft: "2.25rem" }} />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input" style={{ width: "10rem" }}>
          <option value="all">カテゴリ: すべて</option>
          <option value="repair">修繕費</option>
          <option value="cleaning">清掃費</option>
          <option value="insurance">保険料</option>
          <option value="tax">税金</option>
          <option value="utility">光熱費</option>
          <option value="other">その他</option>
        </select>
        <select value={chargeFilter} onChange={(e) => setChargeFilter(e.target.value)} className="input" style={{ width: "10rem" }}>
          <option value="all">負担区分: すべて</option>
          <option value="true">オーナー負担</option>
          <option value="false">管理会社負担</option>
        </select>
        {(search || categoryFilter !== "all" || chargeFilter !== "all") && (
          <span className="text-[12px] text-ink-3">{filtered.length}件</span>
        )}
      </div>

      {/* テーブル */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-ink-3 border-b border-line">
                {cols.map((col) => (
                  <th
                    key={col.key}
                    className={`px-5 py-2.5 font-medium ${col.align === "right" ? "text-right" : ""} ${col.sortable ? "cursor-pointer select-none hover:text-ink transition-colors" : ""}`}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && <ArrowUpDown size={11} className={sortKey === col.key ? "text-accent" : "opacity-30"} />}
                    </span>
                  </th>
                ))}
                <th className="px-3 py-2.5 font-medium w-12 sticky right-0 bg-inherit" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-ink-3">{`${monthLabel}の経費データがありません`}</td></tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-line last:border-0 hover:bg-bg-2/30 transition-colors">
                    <td className="px-5 py-2.5">{item.expense_date}</td>
                    <td className="px-5 py-2.5"><StatusBadge status={item.category} /></td>
                    <td className="px-5 py-2.5"><span className="font-medium">{item.description}</span></td>
                    <td className="px-5 py-2.5"><span className="text-ink-2">{item.property?.name || "—"}</span></td>
                    <td className="px-5 py-2.5">{item.unit?.unit_number || "—"}</td>
                    <td className="px-5 py-2.5 text-right"><span className="font-medium tabular-nums">¥{Number(item.amount).toLocaleString()}</span></td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${item.is_owner_charge ? "text-warn" : "text-accent"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_owner_charge ? "bg-warn" : "bg-accent"}`} />
                        {item.is_owner_charge ? "オーナー" : "管理会社"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 sticky right-0 bg-inherit" onClick={(e) => e.stopPropagation()}>
                      <RowMenu onEdit={() => { setEditData(item); setModalOpen(true); }} onDelete={() => handleDelete(item)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditData(null); }} properties={properties} owners={owners} editData={editData} />
    </>
  );
}
