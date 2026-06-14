"use client";

import { useRouter } from "next/navigation";
import FilterableTable from "./FilterableTable";

interface PaymentHistoryTableProps {
  batches: Record<string, any>[];
}

export default function PaymentHistoryTable({ batches }: PaymentHistoryTableProps) {
  const router = useRouter();

  return (
    <FilterableTable
      data={batches}
      pageSize={10}
      searchFields={["batch_date", "notes"]}
      searchPlaceholder="振込日・備考で検索..."
      emptyMessage="まだ振込バッチはありません。上で対象を選んで作成すると、ここに履歴が残ります。"
      onRowClick={(b) => router.push(`/payments/${b.id}`)}
      columns={[
        {
          key: "batch_date",
          label: "振込日",
          sortable: true,
          render: (b) => <span className="strong">{b.batch_date}</span>,
        },
        {
          key: "status",
          label: "ステータス",
          render: (b) => (
            <span className={`charge-tag ${b.status === "executed" ? "accent" : ""}`}>
              {b.status === "executed" ? "振込実行済み" : "下書き"}
            </span>
          ),
        },
        {
          key: "total_amount",
          label: "合計金額",
          align: "right" as const,
          sortable: true,
          render: (b) => <span className="font-medium">¥{Number(b.total_amount).toLocaleString()}</span>,
        },
        {
          key: "notes",
          label: "備考",
          render: (b) => <span className="text-ink-3">{b.notes ?? ""}</span>,
        },
      ]}
    />
  );
}
