"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";

interface ContractsTableProps {
  data: Record<string, any>[];
  alertDays?: number;
}

export default function ContractsTable({ data, alertDays = 90 }: ContractsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");

  const enrichedData = useMemo(() => {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    return data.map((c) => {
      let expiryStatus = "none";
      if (c.end_date) {
        const remaining = Math.ceil((new Date(c.end_date).getTime() - now) / msPerDay);
        if (remaining <= 0) expiryStatus = "expired";
        else if (remaining <= alertDays) expiryStatus = "expiring";
      }
      return { ...c, _expiry_status: expiryStatus };
    });
  }, [data, alertDays]);

  return (
    <FilterableTable
      data={enrichedData}
      searchFields={["tenant.name", "unit.property.name", "unit.unit_number"]}
      searchPlaceholder="入居者・物件名で検索..."
      initialFilters={filterParam === "expiring" ? { _expiry_status: "expiring" } : {}}
      filters={[
        {
          key: "_expiry_status",
          label: "満了状況",
          options: [
            { value: "expiring", label: "満了間近" },
            { value: "expired", label: "期限切れ" },
            { value: "none", label: "問題なし" },
          ],
        },
        {
          key: "contract_type",
          label: "契約種別",
          options: [
            { value: "fixed", label: "定期" },
            { value: "ordinary", label: "普通" },
          ],
        },
        {
          key: "_move_out_status",
          label: "退去状態",
          options: [
            { value: "pending", label: "退去申請中" },
            { value: "approved", label: "退去予定" },
          ],
        },
      ]}
      columns={[
        { key: "tenant.name", label: "入居者", sortable: true, render: (item) => <span className="font-medium">{item.tenant?.name}</span> },
        {
          key: "unit.property.name",
          label: "物件・部屋",
          render: (item) => <span>{item.unit?.property?.name} {item.unit?.unit_number}</span>,
        },
        { key: "contract_type", label: "種別", render: (item) => <StatusBadge status={item.contract_type} /> },
        { key: "start_date", label: "契約開始", sortable: true },
        {
          key: "end_date",
          label: "契約終了",
          sortable: true,
          render: (item) => {
            const remainingDays = item.end_date
              ? Math.ceil((new Date(item.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const isExpired = remainingDays !== null && remainingDays <= 0;
            const isUrgent = remainingDays !== null && remainingDays > 0 && remainingDays <= 30;
            const isWarning = remainingDays !== null && remainingDays > 30 && remainingDays <= alertDays;
            return (
              <div className="flex items-center gap-2">
                <span>{item.end_date || "—"}</span>
                {isExpired && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-danger/15 text-danger">
                    期限切れ
                  </span>
                )}
                {isUrgent && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-danger/15 text-danger">
                    あと{remainingDays}日
                  </span>
                )}
                {isWarning && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-warn/15 text-warn">
                    あと{remainingDays}日
                  </span>
                )}
              </div>
            );
          },
        },
        {
          key: "_move_out_status",
          label: "状態",
          render: (item) => {
            if (item._move_out_status === "pending") {
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-warn-tint text-warn">
                  退去申請中
                </span>
              );
            }
            if (item._move_out_status === "approved") {
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-danger-tint text-danger">
                  退去予定 {item._move_out_date}
                </span>
              );
            }
            return <span className="text-[11px] text-ink-4">入居中</span>;
          },
        },
        {
          key: "rent",
          label: "賃料",
          align: "right" as const,
          sortable: true,
          render: (item) => <span className="tabular-nums">¥{Number(item.rent).toLocaleString()}</span>,
        },
        {
          key: "management_fee",
          label: "管理費",
          align: "right" as const,
          render: (item) => <span className="tabular-nums">¥{Number(item.management_fee).toLocaleString()}</span>,
        },
      ]}
      onRowClick={(item) => router.push(`/contracts/${item.id}`)}
      rowClassName={(item) => {
        const remainingDays = item.end_date
          ? Math.ceil((new Date(item.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;
        return remainingDays !== null && remainingDays <= 30 && remainingDays > 0 ? "bg-danger-tint" : "";
      }}
    />
  );
}
