"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ownerSchema, type OwnerFormData } from "@/lib/schemas";
import type { ZodError } from "zod";
import BankSuggest from "./BankSuggest";

interface OwnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Record<string, any> | null;
}

export default function OwnerFormModal({
  isOpen,
  onClose,
  editData,
}: OwnerFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");
  const [bankName, setBankName] = useState(editData?.bank_name || "");
  const [bankCode, setBankCode] = useState(editData?.bank_code || "");
  const [branchName, setBranchName] = useState(editData?.bank_branch || "");
  const [branchCode, setBranchCode] = useState(editData?.bank_branch_code || "");

  useEffect(() => {
    setBankName(editData?.bank_name || "");
    setBankCode(editData?.bank_code || "");
    setBranchName(editData?.bank_branch || "");
    setBranchCode(editData?.bank_branch_code || "");
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!editData;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    try {
      const parsed = ownerSchema.parse(data) as OwnerFormData;
      setLoading(true);

      const url = isEdit ? `/api/owners/${editData!.id}` : "/api/owners";
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
      if (zodErr.flatten) {
        setErrors(zodErr.flatten().fieldErrors as Record<string, string[]>);
      }
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
            {isEdit ? "オーナーを編集" : "オーナーを追加"}
          </h2>
          <button
            onClick={onClose}
            className="text-ink-3 hover:text-ink transition-colors"
          >
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
              氏名 <span className="text-danger">*</span>
            </label>
            <input
              name="name"
              defaultValue={editData?.name || ""}
              className="input"
              placeholder="例: 山田太郎"
            />
            {errors.name && (
              <p className="text-danger text-sm mt-1">{errors.name[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                電話番号
              </label>
              <input
                name="phone"
                defaultValue={editData?.phone || ""}
                className="input"
                placeholder="例: 0312345678"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                メールアドレス
              </label>
              <input
                name="email"
                type="email"
                defaultValue={editData?.email || ""}
                className="input"
                placeholder="例: owner@example.com"
              />
              {errors.email && (
                <p className="text-danger text-sm mt-1">{errors.email[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                郵便番号
              </label>
              <input
                name="postal_code"
                defaultValue={editData?.postal_code || ""}
                className="input"
                placeholder="例: 160-0023"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                住所
              </label>
              <input
                name="address"
                defaultValue={editData?.address || ""}
                className="input"
                placeholder="例: 東京都新宿区西新宿1-1-1"
              />
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <h3 className="text-[13px] font-medium text-ink-2 mb-3">振込先情報</h3>
            <BankSuggest
              nameValue={bankName}
              codeValue={bankCode}
              onNameChange={setBankName}
              onCodeChange={setBankCode}
              branchNameValue={branchName}
              branchCodeValue={branchCode}
              onBranchNameChange={setBranchName}
              onBranchCodeChange={setBranchCode}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  口座種別
                </label>
                <select
                  name="bank_account_type"
                  defaultValue={editData?.bank_account_type || ""}
                  className="input"
                >
                  <option value="">選択</option>
                  <option value="普通">普通</option>
                  <option value="当座">当座</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  口座番号
                </label>
                <input
                  name="bank_account_number"
                  defaultValue={editData?.bank_account_number || ""}
                  className="input"
                  placeholder="例: 1234567"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  口座名義（カナ）
                </label>
                <input
                  name="bank_account_holder"
                  defaultValue={editData?.bank_account_holder || ""}
                  className="input"
                  placeholder="例: ヤマダ タロウ"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              備考
            </label>
            <textarea
              name="notes"
              defaultValue={editData?.notes || ""}
              className="input"
              rows={2}
              placeholder="メモや備考"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? "保存中..." : isEdit ? "更新する" : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
