"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileDown } from "lucide-react";
import StatusBadge from "./StatusBadge";
import RemittanceFormModal from "./RemittanceFormModal";
import ZenginCsvModal from "./ZenginCsvModal";
import { usePermission } from "@/lib/use-permission";

interface OwnerOption {
  id: string;
  name: string;
}

interface OwnerSummary {
  id: string;
  name: string;
  netAmount: number;
}

interface RemittancesPageClientProps {
  owners: OwnerOption[];
  remittances: Record<string, any>[];
  ownerSummaries: OwnerSummary[];
}

const paymentMethodLabel: Record<string, string> = {
  transfer: "振込",
  cash: "現金",
};

export default function RemittancesPageClient({ owners, remittances, ownerSummaries }: RemittancesPageClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, any> | null>(null);
  const [zenginOpen, setZenginOpen] = useState(false);
  const canCreate = usePermission("remittances:create");
  const canExport = usePermission("export:csv");

  return (
    <>
      {/* アクションボタン — ページ上部 */}
      <div className="flex justify-end mb-4 gap-2">
        {canExport && (
          <button
            onClick={() => setZenginOpen(true)}
            className="btn btn-secondary flex items-center gap-1.5"
          >
            <FileDown size={15} /> 全銀データ
          </button>
        )}
        {canCreate && (
          <button
            onClick={() => { setEditData(null); setModalOpen(true); }}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Plus size={15} /> 送金を作成
          </button>
        )}
      </div>

      {/* 送金履歴 */}
      {remittances.length > 0 && (
        <div className="section">
          <div className="section-head-bar">
            <h2>送金履歴</h2>
            <span className="desc">{remittances.length}件</span>
          </div>
          <div className="section-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>対象月</th>
                  <th>オーナー</th>
                  <th style={{ textAlign: "right" }}>家賃収入</th>
                  <th style={{ textAlign: "right" }}>管理手数料</th>
                  <th style={{ textAlign: "right" }}>経費控除</th>
                  <th style={{ textAlign: "right" }}>送金額</th>
                  <th>方法</th>
                  <th>状態</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {remittances.map((r) => (
                  <tr
                    key={r.id}
                    className="row-hover"
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/remittances/${r.id}`)}
                  >
                    <td className="mono">{r.remittance_month?.slice(0, 7)}</td>
                    <td className="strong">{r.owner?.name ?? "—"}</td>
                    <td className="num">¥{Number(r.total_rent).toLocaleString()}</td>
                    <td className="num" style={{ color: "var(--danger)" }}>-¥{Number(r.management_fee_deducted).toLocaleString()}</td>
                    <td className="num" style={{ color: "var(--warn)" }}>
                      {Number(r.expense_deducted) > 0 ? `-¥${Number(r.expense_deducted).toLocaleString()}` : "—"}
                    </td>
                    <td className="num strong" style={{ color: "var(--accent-deep)" }}>
                      ¥{Number(r.net_amount).toLocaleString()}
                      {r.manual_override && <span style={{ fontSize: 10, color: "var(--warn)", marginLeft: 4 }}>手動</span>}
                      {Number(r.carryover_to_next) > 0 && (
                        <span
                          title={`翌月繰越 ¥${Number(r.carryover_to_next).toLocaleString()}`}
                          style={{ fontSize: 10, color: "var(--warn)", marginLeft: 4 }}
                        >
                          ▶¥{Number(r.carryover_to_next).toLocaleString()}
                        </span>
                      )}
                      {Number(r.carryover_from_prev) > 0 && (
                        <span
                          title={`前月繰越 ¥${Number(r.carryover_from_prev).toLocaleString()} を控除済`}
                          style={{ fontSize: 10, color: "var(--ink-3)", marginLeft: 4 }}
                        >
                          ◀¥{Number(r.carryover_from_prev).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--ink-2)" }}>{paymentMethodLabel[r.payment_method] || "振込"}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <a href={`/api/remittances/${r.id}/pdf`} target="_blank" rel="noopener noreferrer" className="rlink" style={{ fontSize: 11 }}>
                        PDF
                      </a>
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

      <ZenginCsvModal
        isOpen={zenginOpen}
        onClose={() => setZenginOpen(false)}
        remittances={remittances}
        ownerSummaries={ownerSummaries}
      />
    </>
  );
}
