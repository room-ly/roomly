"use client";

import { useRouter } from "next/navigation";
import FilterableTable from "./FilterableTable";
import { formatPhone } from "@/lib/phone";

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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="tn-av" style={{
                width: 28, height: 28, fontSize: 11,
                background: "var(--accent-tint)", color: "var(--accent-deep)",
              }}>
                {item.name?.charAt(0)}
              </span>
              <span className="strong">{item.name}</span>
            </div>
          ),
        },
        { key: "phone", label: "電話番号", render: (item) => <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{formatPhone(item.phone) || "—"}</span> },
        { key: "propertyCount", label: "物件数", align: "center" as const, render: (item) => <span className="mono">{item.propertyCount}</span> },
        {
          key: "occupancy",
          label: "入居率",
          render: (item) => {
            const rate = item.unitCount > 0 ? Math.round((item.occupiedCount / item.unitCount) * 100) : 0;
            return (
              <div className="owner-occ">
                <span className="num"><b>{rate}</b>%</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>{item.occupiedCount}/{item.unitCount}</span>
                <div className="owner-occ-bar">
                  <div
                    className="owner-occ-bar-fill"
                    style={{
                      width: `${rate}%`,
                      background: rate >= 80 ? "var(--accent)" : rate >= 50 ? "var(--warn)" : "var(--danger)",
                    }}
                  />
                </div>
              </div>
            );
          },
        },
        {
          key: "email",
          label: "メール",
          render: (item) => <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{item.email || "—"}</span>,
        },
      ]}
      onRowClick={(item) => router.push(`/owners/${item.id}`)}
    />
  );
}
