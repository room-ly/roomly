"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MonthSelector from "./MonthSelector";
import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";
import { RentPaymentButton } from "./RentPageClient";

interface RentTableProps {
  data: Record<string, any>[];
}

function getAvailableMonths(data: Record<string, any>[]): string[] {
  const set = new Set<string>();
  for (const item of data) {
    if (item.billing_month) set.add(item.billing_month);
  }
  return Array.from(set).sort().reverse();
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type StatusTab = "all" | "paid" | "unpaid" | "overdue";

export default function RentTable({ data }: RentTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const availableMonths = useMemo(() => getAvailableMonths(data), [data]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (statusParam) return "all";
    const current = getCurrentMonth();
    return availableMonths.includes(current) ? current : availableMonths[0] || current;
  });
  const [activeTab, setActiveTab] = useState<StatusTab>(() => {
    if (statusParam === "overdue") return "overdue";
    if (statusParam === "unpaid") return "unpaid";
    if (statusParam === "paid") return "paid";
    return "all";
  });

  const monthFiltered = useMemo(() => {
    if (selectedMonth === "all") return data;
    return data.filter((b) => b.billing_month === selectedMonth);
  }, [data, selectedMonth]);

  const paidItems = monthFiltered.filter((b) => b.status === "paid");
  const unpaidItems = monthFiltered.filter((b) => b.status !== "paid");
  const overdueItems = monthFiltered.filter((b) => b.status === "overdue");

  const tabFiltered = useMemo(() => {
    if (activeTab === "paid") return paidItems;
    if (activeTab === "unpaid") return unpaidItems;
    if (activeTab === "overdue") return overdueItems;
    return monthFiltered;
  }, [monthFiltered, activeTab, paidItems, unpaidItems, overdueItems]);

  const totalExpected = monthFiltered.reduce((s, b) => s + Number(b.total_amount), 0);
  const totalPaid = paidItems.reduce((s, b) => s + Number(b.total_amount), 0);
  const collectionRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;
  const unpaidAmount = totalExpected - totalPaid;

  const tabs: { key: StatusTab; label: string; count: number; danger?: boolean }[] = [
    { key: "all", label: "すべて", count: monthFiltered.length },
    { key: "paid", label: "入金済", count: paidItems.length },
    { key: "unpaid", label: "未入金", count: unpaidItems.length },
    { key: "overdue", label: "滞納", count: overdueItems.length, danger: true },
  ];

  return (
    <>
      <MonthSelector selectedMonth={selectedMonth} availableMonths={availableMonths} onChange={setSelectedMonth} />

      <div className="cols-summary">
        <div className="sum-card">
          <span className="sum-label">請求総額</span>
          <span className="sum-value serif-i">¥{totalExpected.toLocaleString()}</span>
          <span className="sum-foot mono">{monthFiltered.length}件</span>
        </div>
        <div className="sum-card">
          <span className="sum-label">入金済</span>
          <span className="sum-value serif-i" style={{ color: "var(--accent-deep)" }}>¥{totalPaid.toLocaleString()}</span>
          <span className="sum-foot mono">{collectionRate}% · {paidItems.length}件</span>
        </div>
        <div className="sum-card">
          <span className="sum-label">未収・滞納</span>
          <span className="sum-value serif-i" style={{ color: unpaidItems.length > 0 ? "var(--danger)" : undefined }}>¥{unpaidAmount.toLocaleString()}</span>
          <span className="sum-foot mono" style={{ color: overdueItems.length > 0 ? "var(--danger)" : undefined }}>{unpaidItems.length}件{overdueItems.length > 0 && ` (滞納${overdueItems.length}件)`}</span>
        </div>
        <div className="sum-card">
          <span className="sum-label">回収率</span>
          <span className="sum-value serif-i">{collectionRate}%</span>
          <div style={{ height: 4, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden", marginTop: 4 }}>
            <div style={{ height: "100%", background: "var(--accent)", borderRadius: 99, width: `${collectionRate}%`, transition: "width .3s" }} />
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="tb-tabs">
          {tabs.map((t) => (
            <span
              key={t.key}
              className={`tb-tab${activeTab === t.key ? " is-active" : ""}${t.danger ? " danger" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}<span className="c">{t.count}</span>
            </span>
          ))}
        </div>
      </div>

      <FilterableTable
        data={tabFiltered}
        searchFields={["contract.tenant.name", "contract.unit.property.name", "contract.unit.unit_number"]}
        searchPlaceholder="入居者・物件名で検索..."
        columns={[
          {
            key: "contract.tenant.name",
            label: "入居者 / 部屋",
            sortable: true,
            render: (item) => (
              <div>
                <div className="strong">{item.contract?.tenant?.name || "—"}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                  {item.contract?.unit?.property?.name || ""} {item.contract?.unit?.unit_number || ""}
                </div>
              </div>
            ),
          },
          {
            key: "due_date",
            label: "請求日",
            sortable: true,
            render: (item) => <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{item.due_date || "—"}</span>,
          },
          {
            key: "_paid_date",
            label: "入金日",
            render: (item) => {
              const payment = item.rent_payments?.[0];
              const paidDate = payment?.payment_date || "—";
              return <span className="mono" style={{ fontSize: 12, color: paidDate === "—" ? "var(--ink-4)" : "var(--ink-2)" }}>{paidDate}</span>;
            },
          },
          {
            key: "total_amount",
            label: "金額",
            align: "right" as const,
            sortable: true,
            render: (item) => {
              const paid = (item.rent_payments as any[] || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
              const diff = paid - Number(item.total_amount);
              return (
                <div>
                  <span className="num">¥{Number(item.total_amount).toLocaleString()}</span>
                  {paid > 0 && diff > 0 && (
                    <div style={{ fontSize: 11, color: "#2b6cb0" }}>+¥{diff.toLocaleString()} 超過</div>
                  )}
                  {item.status !== "paid" && paid > 0 && diff < 0 && (
                    <div style={{ fontSize: 11, color: "var(--danger)" }}>-¥{Math.abs(diff).toLocaleString()} 不足</div>
                  )}
                </div>
              );
            },
          },
          {
            key: "status",
            label: "状態",
            render: (item) => <StatusBadge status={item.status} />,
          },
          {
            key: "_action",
            label: "",
            render: (item) =>
              item.status !== "paid" ? (
                <RentPaymentButton
                  billing={{
                    id: item.id,
                    total_amount: Number(item.total_amount),
                    paid_amount: (item.rent_payments as any[] || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
                    tenant_name: item.contract?.tenant?.name || "—",
                    unit_label: `${item.contract?.unit?.property?.name || ""} ${item.contract?.unit?.unit_number || ""}`,
                    billing_month: item.billing_month,
                  }}
                />
              ) : null,
          },
        ]}
        onRowClick={(item) => router.push(`/rent/${item.id}`)}
        rowClassName={(item) => (item.status === "overdue" || item.status === "partial" ? "bg-danger-tint" : "")}
      />
    </>
  );
}
