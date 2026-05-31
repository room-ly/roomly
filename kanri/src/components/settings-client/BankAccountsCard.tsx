"use client";

import { Plus, Trash2, Pencil, Building2, Star } from "lucide-react";

type BankAccount = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export default function BankAccountsCard({
  accounts,
  canEditSettings,
  onAdd,
  onEdit,
  onDelete,
}: {
  accounts: BankAccount[];
  canEditSettings: boolean;
  onAdd: () => void;
  onEdit: (a: BankAccount) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[14px] font-semibold">振込元口座</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">全銀フォーマットCSV出力時の依頼人情報</p>
        </div>
        {canEditSettings && (
          <button type="button" onClick={onAdd} className="btn btn-primary text-[13px]">
            <Plus size={14} /> 口座を追加
          </button>
        )}
      </div>

      {accounts.length === 0 ? (
        <p className="text-[13px] text-ink-3 bg-bg-2 rounded-lg px-4 py-3">
          口座が登録されていません。全銀CSV出力には口座の登録が必要です。
        </p>
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between p-3 rounded-lg bg-bg-2 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-tint flex items-center justify-center">
                  <Building2 size={14} className="text-accent-deep" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium">{a.label}</p>
                    {a.is_default && (
                      <span className="flex items-center gap-0.5 text-[10px] text-accent-deep bg-accent-tint px-1.5 py-0.5 rounded font-medium">
                        <Star size={9} /> デフォルト
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-3 mt-0.5">
                    {a.bank_name}（{a.bank_code}）{a.branch_name}（{a.branch_code}）
                    {a.account_type === "2" ? "当座" : "普通"} {a.account_number} {a.account_holder}
                  </p>
                </div>
              </div>
              {canEditSettings && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(a)}
                    className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-accent transition-all p-1 rounded hover:bg-accent/10"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(a.id)}
                    className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-danger transition-all p-1 rounded hover:bg-danger/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
