"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import StatusBadge from "./StatusBadge";
import RemittanceFormModal from "./RemittanceFormModal";

interface OwnerOption {
  id: string;
  name: string;
}

interface RemittancesPageClientProps {
  owners: OwnerOption[];
  remittances: Record<string, any>[];
}

const paymentMethodLabel: Record<string, string> = {
  transfer: "振込",
  cash: "現金",
};

export default function RemittancesPageClient({ owners, remittances }: RemittancesPageClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, any> | null>(null);

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setEditData(null); setModalOpen(true); }}
          className="btn btn-primary flex items-center gap-1.5"
        >
          <Plus size={15} /> 送金を作成
        </button>
      </div>

      {remittances.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-line">
            <h2 className="text-[13px] font-semibold">送金履歴</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-ink-3 border-b border-line">
                  <th className="px-5 py-2.5 font-medium">対象月</th>
                  <th className="px-5 py-2.5 font-medium">オーナー</th>
                  <th className="px-5 py-2.5 font-medium text-right">家賃収入</th>
                  <th className="px-5 py-2.5 font-medium text-right">管理手数料</th>
                  <th className="px-5 py-2.5 font-medium text-right">経費控除</th>
                  <th className="px-5 py-2.5 font-medium text-right">送金額</th>
                  <th className="px-5 py-2.5 font-medium">方法</th>
                  <th className="px-5 py-2.5 font-medium">状態</th>
                  <th className="px-5 py-2.5 font-medium"></th>
                  <th className="px-3 py-2.5 font-medium w-12 sticky right-0 bg-inherit"></th>
                </tr>
              </thead>
              <tbody>
                {remittances.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0 hover:bg-bg-2/30 transition-colors">
                    <td className="px-5 py-2.5">{r.remittance_month?.slice(0, 7)}</td>
                    <td className="px-5 py-2.5 font-medium">{r.owner?.name ?? "—"}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">¥{Number(r.total_rent).toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-right text-danger tabular-nums">-¥{Number(r.management_fee_deducted).toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-right text-warn tabular-nums">
                      {Number(r.expense_deducted) > 0 ? `-¥${Number(r.expense_deducted).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium text-accent tabular-nums">
                      ¥{Number(r.net_amount).toLocaleString()}
                      {r.manual_override && <span className="text-[10px] text-warn ml-1">手動</span>}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="text-[12px] text-ink-2">{paymentMethodLabel[r.payment_method] || "振込"}</span>
                    </td>
                    <td className="px-5 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-2.5">
                      <a href={`/api/remittances/${r.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent hover:underline">
                        PDF
                      </a>
                    </td>
                    <td className="px-3 py-2.5 sticky right-0 bg-inherit" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setEditData(r); setModalOpen(true); }}
                        className="p-1.5 rounded text-ink-3 hover:text-accent hover:bg-accent-tint transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {remittances.length === 0 && (
        <div className="card p-8 text-center text-ink-3 text-[13px]">
          送金履歴がありません。「送金を作成」から月次送金を生成できます。
        </div>
      )}

      <RemittanceFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        owners={owners}
        editData={editData}
      />
    </>
  );
}
