"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Landmark } from "lucide-react";
import { usePermission } from "@/lib/use-permission";
import LoanFormModal from "./LoanFormModal";

interface SelectItem {
  id: string;
  label: string;
  owner_id?: string;
}

interface Summary {
  activeCount: number;
  totalPrincipal: number;
  outstanding: number;
}

interface Props {
  loans: Record<string, any>[];
  summary: Summary;
  properties: SelectItem[];
  owners: SelectItem[];
}

const STATUS_LABEL: Record<string, string> = {
  active: "返済中",
  completed: "完済",
  refinanced: "借換",
};

const yen = (v: number | null | undefined) =>
  v == null ? "—" : `¥${Math.round(Number(v)).toLocaleString()}`;

export default function LoansPageClient({ loans, summary, properties, owners }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, any> | null>(null);
  const canCreate = usePermission("loans:create");
  const canEdit = usePermission("loans:edit");
  const canDelete = usePermission("loans:delete");

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？返済予定表も削除されます。`)) return;
    const res = await fetch(`/api/loans/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("削除に失敗しました");
  }

  return (
    <>
      {/* サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="card p-4">
          <div className="text-ink-3 text-xs mb-1">返済中のローン</div>
          <div className="text-xl font-semibold">{summary.activeCount}件</div>
        </div>
        <div className="card p-4">
          <div className="text-ink-3 text-xs mb-1">借入元本合計</div>
          <div className="text-xl font-semibold">{yen(summary.totalPrincipal)}</div>
        </div>
        <div className="card p-4">
          <div className="text-ink-3 text-xs mb-1">残高（概算）</div>
          <div className="text-xl font-semibold">{yen(summary.outstanding)}</div>
        </div>
      </div>

      {canCreate && (
        <button className="btn btn-primary" onClick={() => { setEditData(null); setIsOpen(true); }}>
          <Plus size={14} />
          ローンを追加
        </button>
      )}

      {loans.length === 0 ? (
        <div className="card p-10 text-center text-ink-3 mt-4">
          <Landmark size={28} className="mx-auto mb-2 text-ink-4" />
          ローンが登録されていません。<br />
          自社所有物件のアパートローンを追加すると、返済予定表を管理できます。
        </div>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left px-4 py-3 font-medium text-ink-2">ローン名</th>
                <th className="text-left px-4 py-3 font-medium text-ink-2">借入先</th>
                <th className="text-left px-4 py-3 font-medium text-ink-2">対象物件</th>
                <th className="text-right px-4 py-3 font-medium text-ink-2">借入元本</th>
                <th className="text-right px-4 py-3 font-medium text-ink-2">金利</th>
                <th className="text-left px-4 py-3 font-medium text-ink-2">状態</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loans.map((l) => {
                const props = (l.loan_properties ?? []) as Record<string, any>[];
                return (
                  <tr key={l.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/loans/${l.id}`} className="hover:text-accent transition-colors">
                        {l.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-2">{l.lender_name}</td>
                    <td className="px-4 py-3 text-ink-2">
                      {props.length === 0 ? (
                        <span className="text-ink-3">—</span>
                      ) : props.length === 1 ? (
                        props[0].property?.name ?? "—"
                      ) : (
                        `${props[0].property?.name ?? ""} 他${props.length - 1}件`
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{yen(l.principal_amount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-2">
                      {l.interest_rate != null ? `${l.interest_rate}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-2">{STATUS_LABEL[l.status] ?? l.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {canEdit && (
                          <button onClick={() => { setEditData(l); setIsOpen(true); }} className="text-ink-3 hover:text-accent transition-colors">
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(l.id, l.name)} className="text-ink-3 hover:text-danger transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <LoanFormModal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setEditData(null); }}
        editData={editData}
        properties={properties}
        owners={owners}
      />
    </>
  );
}
