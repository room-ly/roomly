"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpDown } from "lucide-react";
import MonthSelector from "./MonthSelector";
import StatusBadge from "./StatusBadge";
import { EXPENSE_STATUS_LABELS, type ExpenseStatus } from "@/lib/schemas-expense";

interface ExpensesTableProps {
  data: Record<string, any>[];
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

type ChargeTab = "all" | "owner" | "tenant" | "company" | "pending" | "overdue";

function chargeBadges(e: Record<string, any>) {
  const out: { label: string; color: string; amount: number }[] = [];
  if (Number(e.owner_amount) > 0) out.push({ label: "オーナー", color: "warn", amount: Number(e.owner_amount) });
  if (Number(e.tenant_amount) > 0) out.push({ label: "入居者", color: "danger", amount: Number(e.tenant_amount) });
  if (Number(e.company_amount) > 0) out.push({ label: "自社", color: "accent", amount: Number(e.company_amount) });
  return out;
}

export default function ExpensesTable({ data }: ExpensesTableProps) {
  const router = useRouter();

  const availableMonths = useMemo(() => getAvailableMonths(data), [data]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const current = getCurrentMonth();
    return availableMonths.includes(current) ? current : availableMonths[0] || current;
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [chargeFilter, setChargeFilter] = useState<ChargeTab>("all");
  const [sortKey, setSortKey] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const monthFiltered = useMemo(() => {
    if (selectedMonth === "all") return data;
    return data.filter((e) => e.expense_date?.startsWith(selectedMonth));
  }, [data, selectedMonth]);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let result = [...monthFiltered];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.description?.toLowerCase().includes(q) ||
          item.property?.name?.toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== "all") result = result.filter((item) => item.category === categoryFilter);
    switch (chargeFilter) {
      case "owner":
        result = result.filter((item) => Number(item.owner_amount) > 0);
        break;
      case "tenant":
        result = result.filter((item) => Number(item.tenant_amount) > 0);
        break;
      case "company":
        result = result.filter((item) => Number(item.company_amount) > 0);
        break;
      case "pending":
        result = result.filter((item) => item.status === "pending_approval");
        break;
      case "overdue":
        result = result.filter(
          (item) => item.payment_due_date && item.payment_due_date < today && !item.paid_at,
        );
        break;
    }
    if (sortKey) {
      result.sort((a, b) => {
        const va = sortKey.includes(".") ? sortKey.split(".").reduce((o: any, k) => o?.[k], a) : a[sortKey];
        const vb = sortKey.includes(".") ? sortKey.split(".").reduce((o: any, k) => o?.[k], b) : b[sortKey];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        return sortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : va > vb ? -1 : va < vb ? 1 : 0;
      });
    }
    return result;
  }, [monthFiltered, search, categoryFilter, chargeFilter, sortKey, sortAsc, today]);

  const totalAmount = monthFiltered.reduce((s, e) => s + Number(e.amount), 0);
  const ownerSum = monthFiltered.reduce((s, e) => s + Number(e.owner_amount || 0), 0);
  const tenantSum = monthFiltered.reduce((s, e) => s + Number(e.tenant_amount || 0), 0);
  const companySum = monthFiltered.reduce((s, e) => s + Number(e.company_amount || 0), 0);
  const pendingCount = monthFiltered.filter((e) => e.status === "pending_approval").length;
  const pendingAmount = monthFiltered
    .filter((e) => e.status === "pending_approval")
    .reduce((s, e) => s + Number(e.amount), 0);
  const overdueCount = monthFiltered.filter(
    (e) => e.payment_due_date && e.payment_due_date < today && !e.paid_at,
  ).length;

  const byCategory = monthFiltered.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const monthLabel =
    selectedMonth === "all"
      ? "全期間"
      : `${Number(selectedMonth.slice(0, 4))}年${Number(selectedMonth.slice(5, 7))}月`;

  const cols = [
    { key: "expense_date", label: "日付", sortable: true },
    { key: "category", label: "カテゴリ" },
    { key: "description", label: "内容" },
    { key: "property.name", label: "物件" },
    { key: "unit.unit_number", label: "部屋" },
    { key: "amount", label: "金額", sortable: true, align: "right" as const },
    { key: "breakdown", label: "内訳" },
    { key: "status", label: "状態" },
  ];

  return (
    <>
      <MonthSelector
        selectedMonth={selectedMonth}
        availableMonths={availableMonths}
        onChange={setSelectedMonth}
      />

      {/* サマリー */}
      <div className="cols-summary">
        <div className="sum-card">
          <span className="sum-label mono">経費総額</span>
          <span className="sum-value serif-i">¥{totalAmount.toLocaleString()}</span>
          <span className="sum-foot mono">{monthFiltered.length}件</span>
        </div>
        <div className="sum-card" style={{ borderLeft: "3px solid var(--warn)" }}>
          <span className="sum-label mono">オーナー負担</span>
          <span className="sum-value serif-i" style={{ color: "var(--warn)" }}>
            ¥{ownerSum.toLocaleString()}
          </span>
          <span className="sum-foot mono">送金時に控除</span>
        </div>
        <div className="sum-card" style={{ borderLeft: "3px solid var(--danger)" }}>
          <span className="sum-label mono">入居者負担</span>
          <span className="sum-value serif-i" style={{ color: "var(--danger)" }}>
            ¥{tenantSum.toLocaleString()}
          </span>
          <span className="sum-foot mono">敷金相殺</span>
        </div>
        <div className="sum-card sum-card-em">
          <span className="sum-label mono">自社負担</span>
          <span className="sum-value serif-i" style={{ color: "var(--accent-deep)" }}>
            ¥{companySum.toLocaleString()}
          </span>
          <span className="sum-foot mono">{monthLabel}</span>
        </div>
      </div>

      {/* カテゴリ別内訳チップ */}
      {Object.keys(byCategory).length > 0 && (
        <div className="cat-chips">
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amount]) => {
              const pct = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
              return (
                <button
                  key={cat}
                  className={`cat-chip${categoryFilter === cat ? " is-active" : ""}`}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                >
                  <StatusBadge status={cat} />
                  <span className="cat-chip-amt num">¥{amount.toLocaleString()}</span>
                  <span className="cat-chip-pct mono">{pct}%</span>
                </button>
              );
            })}
        </div>
      )}

      {/* フィルタ */}
      <div className="toolbar">
        <div className="tb-tabs">
          <span
            className={`tb-tab${chargeFilter === "all" ? " is-active" : ""}`}
            onClick={() => setChargeFilter("all")}
          >
            全て<span className="c">{monthFiltered.length}</span>
          </span>
          <span
            className={`tb-tab${chargeFilter === "owner" ? " is-active" : ""}`}
            onClick={() => setChargeFilter("owner")}
          >
            オーナー<span className="c">{monthFiltered.filter((e) => Number(e.owner_amount) > 0).length}</span>
          </span>
          <span
            className={`tb-tab${chargeFilter === "tenant" ? " is-active" : ""}`}
            onClick={() => setChargeFilter("tenant")}
          >
            入居者<span className="c">{monthFiltered.filter((e) => Number(e.tenant_amount) > 0).length}</span>
          </span>
          <span
            className={`tb-tab${chargeFilter === "company" ? " is-active" : ""}`}
            onClick={() => setChargeFilter("company")}
          >
            自社<span className="c">{monthFiltered.filter((e) => Number(e.company_amount) > 0).length}</span>
          </span>
          <span
            className={`tb-tab${chargeFilter === "pending" ? " is-active" : ""}`}
            onClick={() => setChargeFilter("pending")}
          >
            承認待ち<span className="c">{pendingCount}</span>
          </span>
          <span
            className={`tb-tab${chargeFilter === "overdue" ? " is-active" : ""}`}
            onClick={() => setChargeFilter("overdue")}
          >
            期日超過<span className="c">{overdueCount}</span>
          </span>
        </div>
        <div className="tb-actions">
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-3)",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="内容・物件名で検索..."
              className="input"
              style={{ paddingLeft: "2.25rem", width: "16rem" }}
            />
          </div>
          {(search || categoryFilter !== "all" || chargeFilter !== "all") && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setCategoryFilter("all");
                setChargeFilter("all");
                setSearch("");
              }}
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {pendingCount > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            background: "var(--warn-tint, #fef3c7)",
            borderLeft: "3px solid var(--warn)",
            fontSize: 13,
          }}
        >
          承認待ちが {pendingCount} 件（¥{pendingAmount.toLocaleString()}）あります。
        </div>
      )}

      {/* テーブル */}
      <div className="section">
        <div className="section-body flush">
          <table className="tbl">
            <thead>
              <tr>
                {cols.map((col) => (
                  <th
                    key={col.key}
                    style={col.align === "right" ? { textAlign: "right" } : undefined}
                    className={col.sortable ? "cursor-pointer select-none" : ""}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {col.label}
                      {col.sortable && (
                        <ArrowUpDown
                          size={11}
                          style={{
                            opacity: sortKey === col.key ? 1 : 0.3,
                            color: sortKey === col.key ? "var(--accent)" : undefined,
                          }}
                        />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={cols.length}
                    style={{ textAlign: "center", color: "var(--ink-3)", padding: "32px 0" }}
                  >{`${monthLabel}の経費データがありません`}</td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const badges = chargeBadges(item);
                  const status = (item.status as ExpenseStatus) || "draft";
                  return (
                    <tr
                      key={item.id || idx}
                      className="row-hover"
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/expenses/${item.id}`)}
                    >
                      <td className="mono" style={{ fontSize: 12 }}>
                        {item.expense_date
                          ? `${Number(item.expense_date.slice(5, 7))}/${Number(item.expense_date.slice(8, 10))}`
                          : "—"}
                      </td>
                      <td>
                        <StatusBadge status={item.category} />
                      </td>
                      <td className="strong">{item.description}</td>
                      <td style={{ color: "var(--ink-2)" }}>{item.property?.name || "—"}</td>
                      <td>{item.unit?.unit_number || "—"}</td>
                      <td className="num">¥{Number(item.amount).toLocaleString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {badges.map((b, i) => (
                            <span key={i} className={`charge-tag ${b.color}`}>
                              <span className="dot" />
                              {b.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`charge-tag ${
                            status === "pending_approval"
                              ? "warn"
                              : status === "approved" || status === "paid"
                                ? "accent"
                                : status === "rejected"
                                  ? "danger"
                                  : ""
                          }`}
                        >
                          {EXPENSE_STATUS_LABELS[status]}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
