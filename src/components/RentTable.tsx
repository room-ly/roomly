"use client";

import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";
import { RentPaymentButton } from "./RentPageClient";

interface RentTableProps {
  data: Record<string, any>[];
}

export default function RentTable({ data }: RentTableProps) {
  return (
    <FilterableTable
      data={data}
      searchFields={["contract.tenant.name", "contract.unit.property.name", "contract.unit.unit_number"]}
      searchPlaceholder="入居者・物件名で検索..."
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
      rowClassName={(item) => (item.status === "overdue" ? "bg-danger-tint" : "")}
    />
  );
}
