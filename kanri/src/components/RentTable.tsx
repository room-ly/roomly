"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import MonthSelector from "./MonthSelector";
import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";
import { RentPaymentButton } from "./RentPageClient";

interface RentTableProps {
  data: Record<string, any>[];
  availableMonths: string[];
  selectedMonth: string; // "all" もしくは YYYY-MM-DD
}

type StatusTab = "all" | "paid" | "overdue";

export default function RentTable({ data, availableMonths, selectedMonth }: RentTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const [activeTab, setActiveTab] = useState<StatusTab>(() => {
    if (statusParam === "overdue" || statusParam === "unpaid") return "overdue";
    if (statusParam === "paid") return "paid";
    return "all";
  });

  // 月セレクトはURLパラメータでサーバーリフェッチ
  const handleMonthChange = (month: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  // サーバーで月絞り込み済みなので data はそのまま使う
  const monthFiltered = data;

  const propertyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of data) {
      const property = item.contract?.unit?.property;
      const id = property?.id;
      if (!id) continue;
      if (!map.has(id)) map.set(id, property.name || "(名称未設定)");
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "ja"));
  }, [data]);

  // 滞納判定: due_date を過ぎていて、入金合計が請求額に達していない
  // status カラムが古いまま放置されていても矛盾しないよう、その場で計算する
  const todayStr = new Date().toISOString().slice(0, 10);
  const isUnpaid = (b: Record<string, any>) => {
    const total = Number(b.total_amount) || 0;
    const paid = (b.rent_payments ?? []).reduce(
      (s: number, p: any) => s + (Number(p.amount) || 0),
      0
    );
    return paid < total;
  };
  const isOverdue = (b: Record<string, any>) =>
    isUnpaid(b) && b.due_date && b.due_date < todayStr;

  const paidItems = monthFiltered.filter((b) => !isUnpaid(b));
  const overdueItems = monthFiltered.filter((b) => isOverdue(b));

  const tabFiltered = useMemo(() => {
    if (activeTab === "paid") return paidItems;
    if (activeTab === "overdue") return overdueItems;
    return monthFiltered;
  }, [monthFiltered, activeTab, paidItems, overdueItems]);

  const totalExpected = monthFiltered.reduce((s, b) => s + Number(b.total_amount), 0);
  const totalPaid = paidItems.reduce((s, b) => s + Number(b.total_amount), 0);
  const collectionRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;
  const overdueAmount = overdueItems.reduce((s, b) => {
    const paid = (b.rent_payments ?? []).reduce(
      (sum: number, p: any) => sum + (Number(p.amount) || 0),
      0
    );
    return s + (Number(b.total_amount) - paid);
  }, 0);

  const tabs: { key: StatusTab; label: string; count: number; danger?: boolean }[] = [
    { key: "all", label: "すべて", count: monthFiltered.length },
    { key: "paid", label: "入金済", count: paidItems.length },
    { key: "overdue", label: "滞納", count: overdueItems.length, danger: true },
  ];

  return (
    <>
      <MonthSelector selectedMonth={selectedMonth} availableMonths={availableMonths} onChange={handleMonthChange} />

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
          <span className="sum-label">滞納</span>
          <span className="sum-value serif-i" style={{ color: overdueItems.length > 0 ? "var(--danger)" : undefined }}>¥{overdueAmount.toLocaleString()}</span>
          <span className="sum-foot mono" style={{ color: overdueItems.length > 0 ? "var(--danger)" : undefined }}>{overdueItems.length}件</span>
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
        filters={[
          {
            key: "contract.unit.property.id",
            label: "物件",
            options: propertyOptions,
          },
        ]}
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
                  {isUnpaid(item) && paid > 0 && diff < 0 && (
                    <div style={{ fontSize: 11, color: "var(--danger)" }}>-¥{Math.abs(diff).toLocaleString()} 不足</div>
                  )}
                </div>
              );
            },
          },
          {
            key: "status",
            label: "状態",
            render: (item) => {
              // due_date と入金額から実際の状態を導出（DBのstatusが古いままでも正しく表示）
              const paid = (item.rent_payments as any[] || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
              const total = Number(item.total_amount) || 0;
              let derived: string;
              if (paid >= total) derived = "paid";
              else if (paid > 0) derived = "partial";
              else if (isOverdue(item)) derived = "overdue";
              else derived = "unpaid";
              return <StatusBadge status={derived} />;
            },
          },
          {
            key: "_action",
            label: "",
            render: (item) =>
              isUnpaid(item) ? (
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
        rowClassName={(item) => (isOverdue(item) ? "row-overdue" : "")}
      />
    </>
  );
}
