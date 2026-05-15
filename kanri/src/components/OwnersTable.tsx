"use client";

import { useRouter } from "next/navigation";
import FilterableTable from "./FilterableTable";

interface OwnersTableProps {
  owners: Record<string, any>[];
}

export default function OwnersTable({ owners }: OwnersTableProps) {
  const router = useRouter();

  return (
    <FilterableTable
      data={owners}
      searchFields={["name", "phone", "email"]}
      searchPlaceholder="オーナー名・電話番号で検索..."
      columns={[
        {
          key: "name",
          label: "オーナー名",
          sortable: true,
          render: (item) => (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-accent-tint flex items-center justify-center text-accent text-[11px] font-semibold shrink-0">
                {item.name?.charAt(0)}
              </div>
              <span className="font-medium">{item.name}</span>
            </div>
          ),
        },
        { key: "phone", label: "電話番号", render: (item) => <span className="text-ink-2">{item.phone || "—"}</span> },
        { key: "email", label: "メール", render: (item) => <span className="text-ink-2">{item.email || "—"}</span> },
        { key: "propertyCount", label: "物件数", align: "center" as const, render: (item) => <span className="tabular-nums">{item.propertyCount}</span> },
        { key: "unitCount", label: "総戸数", align: "center" as const, render: (item) => <span className="tabular-nums">{item.unitCount}</span> },
        { key: "occupiedCount", label: "入居", align: "center" as const, render: (item) => <span className="tabular-nums text-accent-deep">{item.occupiedCount}</span> },
        { key: "management_fee_rate", label: "手数料率", align: "right" as const, render: (item) => <span className="tabular-nums">{Number(item.management_fee_rate)}%</span> },
      ]}
      onRowClick={(item) => router.push(`/owners/${item.id}`)}
    />
  );
}
