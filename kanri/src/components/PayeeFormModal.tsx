"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { payeeSchema, type PayeeFormData } from "@/lib/schemas-payee";
import type { ZodError } from "zod";
import BankSuggest from "./BankSuggest";

const CATEGORY_OPTIONS = [
  { value: "repair", label: "修繕業者" },
  { value: "cleaning", label: "クリーニング業者" },
  { value: "insurance", label: "保険会社" },
  { value: "other", label: "その他" },
];

interface PayeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Record<string, any> | null;
}

export default function PayeeFormModal({ isOpen, onClose, editData }: PayeeFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");

  useEffect(() => {
    setBankName(editData?.bank_name || "");
    setBankCode(editData?.bank_code || "");
    setBranchName(editData?.branch_name || "");
    setBranchCode(editData?.branch_code || "");
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!editData;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => { data[key] = value; });
    data.bank_name = bankName;
    data.bank_code = bankCode;
    data.branch_name = branchName;
    data.branch_code = branchCode;

    try {
      const parsed = payeeSchema.parse(data) as PayeeFormData;
      setLoading(true);
      const url = isEdit ? `/api/payees/${editData!.id}` : "/api/payees";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        const err = await res.json();
        if (err.details) {
          setErrors(err.details as Record<string, string[]>);
          setApiError("入力内容を確認してください");
        } else {
          setApiError(err.error || "エラーが発生しました");
        }
        return;
      }
      onClose();
      router.refresh();
    } catch (err) {
      const zodErr = err as ZodError;
      if (zodErr.flatten) setErrors(zodErr.flatten().fieldErrors as Record<string, string[]>);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold">
            {isEdit ? "支払先を編集" : "支払先を追加"}
          </h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {apiError && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              取引先名 <span className="text-danger">*</span>
            </label>
            <input name="name" defaultValue={editData?.name || ""} className="input" placeholder="例: 山田電気工事" />
            {errors.name && <p className="text-danger text-sm mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">カナ（全銀CSV用）</label>
            <input name="name_kana" defaultValue={editData?.name_kana || ""} className="input" placeholder="例: ヤマダデンキコウジ" />
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              カテゴリ <span className="text-danger">*</span>
            </label>
            <select name="category" defaultValue={editData?.category || "other"} className="input">
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-danger text-sm mt-1">{errors.category[0]}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">電話番号</label>
            <input name="phone" defaultValue={editData?.phone || ""} className="input" placeholder="例: 03-1234-5678" />
          </div>

          <hr className="border-border" />
          <p className="text-sm font-medium text-ink-2">振込先口座（全銀CSV出力に使用）</p>

          <BankSuggest
            nameValue={bankName}
            codeValue={bankCode}
            onNameChange={setBankName}
            onCodeChange={setBankCode}
            branchNameValue={branchName}
            branchCodeValue={branchCode}
            onBranchNameChange={setBranchName}
            onBranchCodeChange={setBranchCode}
            showBranch
          />

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">口座種別</label>
            <select name="account_type" defaultValue={editData?.account_type || "ordinary"} className="input">
              <option value="ordinary">普通</option>
              <option value="current">当座</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">口座番号</label>
            <input name="account_number" defaultValue={editData?.account_number || ""} className="input" placeholder="例: 1234567" maxLength={7} />
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">口座名義（カナ）</label>
            <input name="account_holder_kana" defaultValue={editData?.account_holder_kana || ""} className="input" placeholder="例: ヤマダデンキコウジ" />
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">メモ</label>
            <textarea name="notes" defaultValue={editData?.notes || ""} className="input" rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">キャンセル</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? "保存中…" : isEdit ? "更新" : "追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
