import { Plus } from "lucide-react";
import { owners, properties, units } from "@/lib/mock-data";
import PageHeader from "@/components/PageHeader";

export default function OwnersPage() {
  const ownersWithInfo = owners.map((o) => {
    const ownerProps = properties.filter((p) => p.owner_id === o.id);
    const ownerUnits = ownerProps.flatMap((p) =>
      units.filter((u) => u.property_id === p.id)
    );
    const totalRent = ownerUnits
      .filter((u) => u.status === "occupied")
      .reduce((s, u) => s + u.rent, 0);
    const managementFee = Math.round(totalRent * (o.management_fee_rate / 100));
    return {
      ...o,
      propertyCount: ownerProps.length,
      unitCount: ownerUnits.length,
      occupiedCount: ownerUnits.filter((u) => u.status === "occupied").length,
      totalRent,
      managementFee,
      netAmount: totalRent - managementFee,
    };
  });

  return (
    <>
      <PageHeader
        title="オーナー管理"
        description={`${owners.length}名のオーナー`}
        action={
          <button className="btn-primary">
            <Plus size={16} />
            オーナーを追加
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {ownersWithInfo.map((o) => (
          <div key={o.id} className="card card-interactive p-5 cursor-pointer">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white font-semibold">
                {o.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{o.name}</h3>
                <span className="text-xs text-text-muted">手数料 {o.management_fee_rate}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-5">
              <div className="p-2.5 rounded-lg bg-bg-secondary">
                <p className="text-[11px] text-text-muted">物件数</p>
                <p className="text-lg font-bold">{o.propertyCount}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-bg-secondary">
                <p className="text-[11px] text-text-muted">総戸数</p>
                <p className="text-lg font-bold">{o.unitCount}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-bg-secondary">
                <p className="text-[11px] text-text-muted">入居</p>
                <p className="text-lg font-bold text-success">{o.occupiedCount}</p>
              </div>
            </div>

            <div className="border-t border-border-light pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">家賃収入</span>
                <span className="font-medium">¥{o.totalRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">管理手数料</span>
                <span className="text-danger font-medium">-¥{o.managementFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border-light">
                <span className="font-medium">送金額</span>
                <span className="font-bold text-accent text-lg">¥{o.netAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
              {o.phone && <span>{o.phone}</span>}
              {o.email && <span>{o.email}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
