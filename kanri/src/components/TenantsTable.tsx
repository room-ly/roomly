"use client";

import { useRouter } from "next/navigation";
import FilterableTable from "./FilterableTable";

interface TenantsTableProps {
  data: Record<string, any>[];
}

export default function TenantsTable({ data }: TenantsTableProps) {
  const router = useRouter();

  return (
    <FilterableTable
      data={data}
      searchFields={["name", "name_kana", "phone", "email"]}
      searchPlaceholder="名前・電話番号・メールで検索..."
      columns={[
        { key: "name", label: "名前", sortable: true, render: (item) => <span className="font-medium">{item.name}</span> },
        { key: "name_kana", label: "フリガナ", render: (item) => <span className="text-ink-3">{item.name_kana || "—"}</span> },
        { key: "phone", label: "電話番号" },
        { key: "email", label: "メール", render: (item) => <span className="text-ink-3">{item.email || "—"}</span> },
        { key: "workplace", label: "勤務先", render: (item) => <span className="text-ink-3">{item.workplace || "—"}</span> },
        {
          key: "contract.unit.property.name",
          label: "物件・部屋",
          render: (item) =>
            item.contract?.unit ? (
              <span>{item.contract.unit.property?.name} {item.contract.unit.unit_number}</span>
            ) : (
              <span className="text-ink-3">—</span>
            ),
        },
        {
          key: "contract.rent",
          label: "賃料",
          align: "right" as const,
          sortable: true,
          render: (item) => (
            <span className="font-medium tabular-nums">
              {item.contract ? `¥${Number(item.contract.rent).toLocaleString()}` : "—"}
            </span>
          ),
        },
      ]}
      onRowClick={(item) => router.push(`/tenants/${item.id}`)}
    />
  );
}
