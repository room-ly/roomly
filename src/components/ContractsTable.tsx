"use client";

import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";

interface ContractsTableProps {
  data: Record<string, any>[];
}

export default function ContractsTable({ data }: ContractsTableProps) {
  return (
    <FilterableTable
      data={data}
      searchFields={["tenant.name", "unit.property.name", "unit.unit_number"]}
      searchPlaceholder="入居者・物件名で検索..."
      filters={[
        {
          key: "contract_type",
          label: "契約種別",
          options: [
            { value: "fixed", label: "定期" },
            { value: "ordinary", label: "普通" },
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
            const isExpiring = remainingDays !== null && remainingDays > 0 && remainingDays <= 90;
            return (
              <div>
                <div>{item.end_date || "—"}</div>
                {isExpiring && (
                  <span className={`text-[11px] font-medium ${remainingDays! <= 30 ? "text-danger" : "text-warning"}`}>
                    あと{remainingDays}日
                  </span>
                )}
              </div>
            );
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
      rowClassName={(item) => {
        const remainingDays = item.end_date
          ? Math.ceil((new Date(item.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;
        return remainingDays !== null && remainingDays <= 30 && remainingDays > 0 ? "bg-danger/5" : "";
      }}
    />
  );
}
