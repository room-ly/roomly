"use client";

import { X } from "lucide-react";
import BankSuggest from "../BankSuggest";

type BankAccount = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export default function BankAccountModal({
  open,
  editTarget,
  saving,
  error,
  bankName,
  bankCode,
  branchName,
  branchCode,
  setBankName,
  setBankCode,
  setBranchName,
  setBranchCode,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editTarget: BankAccount | null;
  saving: boolean;
  error: string;
  bankName: string;
  bankCode: string;
  branchName: string;
  branchCode: string;
  setBankName: (v: string) => void;
  setBankCode: (v: string) => void;
  setBranchName: (v: string) => void;
  setBranchCode: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold">{editTarget ? "口座を編集" : "口座を追加"}</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              表示名 <span className="text-danger">*</span>
            </label>
            <input
              name="label"
              className="input"
              defaultValue={editTarget?.label || ""}
              placeholder="例: メインバンク"
              required
            />
          </div>
          <BankSuggest
            nameValue={bankName}
            codeValue={bankCode}
            onNameChange={setBankName}
            onCodeChange={setBankCode}
            branchNameValue={branchName}
            branchCodeValue={branchCode}
            onBranchNameChange={setBranchName}
            onBranchCodeChange={setBranchCode}
            branchNameName="branch_name"
            branchCodeName="branch_code"
            required
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">種別</label>
              <select
                name="account_type"
                className="input"
                defaultValue={editTarget?.account_type || "1"}
              >
                <option value="1">普通</option>
                <option value="2">当座</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                口座番号 <span className="text-danger">*</span>
              </label>
              <input
                name="account_number"
                className="input tabular-nums"
                defaultValue={editTarget?.account_number || ""}
                placeholder="1234567"
                maxLength={7}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                名義（カナ） <span className="text-danger">*</span>
              </label>
              <input
                name="account_holder"
                className="input"
                defaultValue={editTarget?.account_holder || ""}
                placeholder="カ）ルームリー"
                required
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_default"
                defaultChecked={editTarget?.is_default ?? false}
                className="rounded border-line"
              />
              <span className="text-sm text-ink-2">デフォルトの口座にする</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2/80 transition-colors"
            >
              キャンセル
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
              {saving ? "保存中..." : editTarget ? "更新する" : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
