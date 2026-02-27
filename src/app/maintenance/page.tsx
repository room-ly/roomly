import { Plus } from "lucide-react";
import { maintenanceRequests } from "@/lib/mock-data";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

export default function MaintenancePage() {
  const sorted = [...maintenanceRequests].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <>
      <PageHeader
        title="修繕管理"
        description={`${maintenanceRequests.length}件の修繕依頼`}
        action={
          <button className="btn-primary">
            <Plus size={16} />
            依頼を登録
          </button>
        }
      />

      {/* フィルター */}
      <div className="flex gap-2 mb-5">
        {["すべて", "未対応", "対応中", "完了"].map((label) => (
          <button
            key={label}
            className={label === "すべて" ? "btn-primary" : "btn-secondary"}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted bg-bg-secondary/50">
                <th className="px-5 py-3 font-medium">件名</th>
                <th className="px-5 py-3 font-medium">物件</th>
                <th className="px-5 py-3 font-medium">部屋</th>
                <th className="px-5 py-3 font-medium">カテゴリ</th>
                <th className="px-5 py-3 font-medium">優先度</th>
                <th className="px-5 py-3 font-medium">状態</th>
                <th className="px-5 py-3 font-medium">報告日</th>
                <th className="px-5 py-3 font-medium">業者</th>
                <th className="px-5 py-3 font-medium text-right">見積</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {sorted.map((m) => {
                const categoryLabels: Record<string, string> = {
                  plumbing: "水回り",
                  electrical: "電気",
                  structural: "構造",
                  equipment: "設備",
                  other: "その他",
                };
                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-bg-secondary/30 transition-colors cursor-pointer ${
                      m.priority === "urgent" ? "bg-danger/5" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-medium">{m.title}</td>
                    <td className="px-5 py-3 text-text-secondary">{m.property?.name}</td>
                    <td className="px-5 py-3">{m.unit_id ? m.unit_id.replace("unit-", "") : "共用部"}</td>
                    <td className="px-5 py-3 text-text-secondary">{categoryLabels[m.category] || m.category}</td>
                    <td className="px-5 py-3"><StatusBadge status={m.priority} /></td>
                    <td className="px-5 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-5 py-3">{m.reported_date}</td>
                    <td className="px-5 py-3 text-text-secondary">{m.vendor_name || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      {m.estimated_cost ? `¥${m.estimated_cost.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
