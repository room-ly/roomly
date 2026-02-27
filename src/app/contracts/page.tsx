import { Plus } from "lucide-react";
import { contracts, units, properties } from "@/lib/mock-data";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

export default function ContractsPage() {
  const contractsWithInfo = contracts.map((c) => {
    const unit = units.find((u) => u.id === c.unit_id);
    const property = unit
      ? properties.find((p) => p.id === unit.property_id)
      : undefined;
    return { ...c, unit, property };
  });

  return (
    <>
      <PageHeader
        title="契約管理"
        description={`${contracts.length}件の契約`}
        action={
          <button className="btn-primary">
            <Plus size={16} />
            新規契約
          </button>
        }
      />

      {/* フィルター */}
      <div className="flex gap-2 mb-5">
        {["すべて", "有効", "満了間近", "解約"].map((label) => (
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
                <th className="px-5 py-3 font-medium">入居者</th>
                <th className="px-5 py-3 font-medium">物件・部屋</th>
                <th className="px-5 py-3 font-medium">種別</th>
                <th className="px-5 py-3 font-medium">契約開始</th>
                <th className="px-5 py-3 font-medium">契約終了</th>
                <th className="px-5 py-3 font-medium text-right">賃料</th>
                <th className="px-5 py-3 font-medium text-right">管理費</th>
                <th className="px-5 py-3 font-medium">状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {contractsWithInfo.map((c) => {
                const isExpiring = c.end_date
                  ? (() => {
                      const diff =
                        (new Date(c.end_date).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24);
                      return diff > 0 && diff <= 90;
                    })()
                  : false;

                return (
                  <tr key={c.id} className="hover:bg-bg-secondary/30 transition-colors cursor-pointer">
                    <td className="px-5 py-3 font-medium">{c.tenant?.name}</td>
                    <td className="px-5 py-3">
                      {c.property?.name} {c.unit?.unit_number}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.contract_type} />
                    </td>
                    <td className="px-5 py-3">{c.start_date}</td>
                    <td className={`px-5 py-3 ${isExpiring ? "text-warning font-medium" : ""}`}>
                      {c.end_date || "—"}
                      {isExpiring && <span className="ml-1 text-xs">※間近</span>}
                    </td>
                    <td className="px-5 py-3 text-right">¥{c.rent.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">¥{c.management_fee.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
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
