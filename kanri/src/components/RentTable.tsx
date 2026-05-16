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

  const monthFiltered = useMemo(() => {
    if (selectedMonth === "all") return data;
    return data.filter((b) => b.billing_month === selectedMonth);
  }, [data, selectedMonth]);

  const totalExpected = monthFiltered.reduce((s, b) => s + Number(b.total_amount), 0);
  const totalPaid = monthFiltered.filter((b) => b.status === "paid").reduce((s, b) => s + Number(b.total_amount), 0);
  const overdueCount = monthFiltered.filter((b) => b.status === "overdue").length;
  const overdueAmount = monthFiltered.filter((b) => b.status === "overdue").reduce((s, b) => s + Number(b.total_amount), 0);
  const collectionRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

  return (
    <>
      <MonthSelector selectedMonth={selectedMonth} availableMonths={availableMonths} onChange={setSelectedMonth} />

      {/* サマリー */}
      <div className="cols-summary">
        <div className="sum-card">
          <span className="sum-label mono">請求総額</span>
          <span className="sum-value serif-i">¥{totalExpected.toLocaleString()}</span>
          <span className="sum-foot mono">{monthFiltered.length}件</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">入金済</span>
          <span className="sum-value serif-i" style={{ color: "var(--accent-deep)" }}>¥{totalPaid.toLocaleString()}</span>
          <span className="sum-foot mono">{monthFiltered.filter((b) => b.status === "paid").length}件</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">回収率</span>
          <span className="sum-value serif-i">{collectionRate}%</span>
          <div style={{ height: 4, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden", marginTop: 4 }}>
            <div style={{ height: "100%", background: "var(--accent)", borderRadius: 99, width: `${collectionRate}%`, transition: "width .3s" }} />
          </div>
        </div>
        <div className="sum-card" style={{ borderLeft: "3px solid var(--danger)" }}>
          <span className="sum-label mono">滞納</span>
          <span className="sum-value serif-i" style={{ color: "var(--danger)" }}>{overdueCount}件</span>
          <span className="sum-foot mono" style={{ color: "var(--danger)" }}>¥{overdueAmount.toLocaleString()}</span>
        </div>
      </div>

      <FilterableTable
        data={monthFiltered}
        searchFields={["contract.tenant.name", "contract.unit.property.name", "contract.unit.unit_number"]}
        searchPlaceholder="入居者・物件名で検索..."
        initialFilters={statusParam ? { status: statusParam } : {}}
        filters={[
          {
            key: "status",
            label: "状態",
            options: [
              { value: "paid", label: "入金済" },
              { value: "unpaid", label: "未入金" },
              { value: "partial", label: "一部入金" },
              { value: "overdue", label: "滞納" },
            ],
          },
        ]}
        columns={[
          {
            key: "contract.unit.property.name",
            label: "物件",
            render: (item) => <span className="text-ink-2">{item.contract?.unit?.property?.name || "—"}</span>,
          },
          { key: "contract.unit.unit_number", label: "部屋", render: (item) => item.contract?.unit?.unit_number || "—" },
          {
            key: "contract.tenant.name",
            label: "入居者",
            sortable: true,
            render: (item) => <span className="font-medium">{item.contract?.tenant?.name || "—"}</span>,
          },
          { key: "billing_month", label: "対象月", sortable: true },
          {
            key: "rent",
            label: "賃料",
            align: "right" as const,
            render: (item) => <span className="tabular-nums">¥{Number(item.rent).toLocaleString()}</span>,
          },
          {
            key: "management_fee",
            label: "管理費",
            align: "right" as const,
            render: (item) => <span className="tabular-nums">¥{Number(item.management_fee).toLocaleString()}</span>,
          },
          {
            key: "total_amount",
            label: "合計",
            align: "right" as const,
            sortable: true,
            render: (item) => <span className="font-medium tabular-nums">¥{Number(item.total_amount).toLocaleString()}</span>,
          },
          { key: "due_date", label: "支払期限", sortable: true },
          { key: "status", label: "状態", render: (item) => <StatusBadge status={item.status} /> },
          {
            key: "_action",
            label: "",
            render: (item) =>
              item.status !== "paid" ? (
                <RentPaymentButton
                  billing={{
                    id: item.id,
                    total_amount: Number(item.total_amount),
                    paid_amount: item.status === "partial" ? Number(item.total_amount) * 0.5 : 0,
                    tenant_name: item.contract?.tenant?.name || "—",
                    unit_label: `${item.contract?.unit?.property?.name || ""} ${item.contract?.unit?.unit_number || ""}`,
                    billing_month: item.billing_month,
                  }}
                />
              ) : null,
          },
        ]}
        onRowClick={(item) => router.push(`/rent/${item.id}`)}
        rowClassName={(item) => (item.status === "overdue" ? "bg-danger-tint" : "")}
      />
    </>
  );
}
