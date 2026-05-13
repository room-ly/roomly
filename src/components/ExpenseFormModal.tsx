"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { expenseSchema } from "@/lib/schemas-expense";
import type { ZodError } from "zod";

interface SelectOption {
  id: string;
  label: string;
  owner_id?: string;
}

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: SelectOption[];
  owners: SelectOption[];
  editData?: Record<string, any> | null;
}

export default function ExpenseFormModal({
  isOpen,
  onClose,
  properties,
  owners,
  editData,
}: ExpenseFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");
  const [isOwnerCharge, setIsOwnerCharge] = useState(editData?.is_owner_charge ?? false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(editData?.property_id || "");

  const selectedOwner = (() => {
    const prop = properties.find((p) => p.id === selectedPropertyId);
    if (!prop?.owner_id) return null;
    return owners.find((o) => o.id === prop.owner_id) ?? null;
  })();

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
    data.is_owner_charge = isOwnerCharge;

    try {
      const parsed = expenseSchema.parse(data);
      setLoading(true);

      const url = isEdit ? `/api/expenses/${editData!.id}` : "/api/expenses";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!res.ok) {
        const err = await res.json();
        setApiError(err.error || "エラーが発生しました");
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
            {isEdit ? "経費を編集" : "経費を登録"}
          </h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {apiError && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">{apiError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                カテゴリ <span className="text-danger">*</span>
              </label>
              <select name="category" defaultValue={editData?.category || ""} className="input">
                <option value="">選択してください</option>
                <option value="repair">修繕費</option>
                <option value="cleaning">清掃費</option>
                <option value="insurance">保険料</option>
                <option value="tax">税金</option>
                <option value="utility">光熱費</option>
                <option value="other">その他</option>
              </select>
              {errors.category && <p className="text-danger text-sm mt-1">{errors.category[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                日付 <span className="text-danger">*</span>
              </label>
              <input
                name="expense_date"
                type="date"
                defaultValue={editData?.expense_date || new Date().toISOString().slice(0, 10)}
                className="input"
              />
              {errors.expense_date && <p className="text-danger text-sm mt-1">{errors.expense_date[0]}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              内容 <span className="text-danger">*</span>
            </label>
            <input
              name="description"
              defaultValue={editData?.description || ""}
              className="input"
              placeholder="例: エアコン修理"
            />
            {errors.description && <p className="text-danger text-sm mt-1">{errors.description[0]}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              金額 <span className="text-danger">*</span>
            </label>
            <input
              name="amount"
              type="number"
              defaultValue={editData?.amount || ""}
              className="input"
              placeholder="例: 50000"
            />
            {errors.amount && <p className="text-danger text-sm mt-1">{errors.amount[0]}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">物件</label>
              <select
                name="property_id"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="input"
              >
                <option value="">未指定</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">オーナー</label>
              <input
                type="text"
                readOnly
                value={selectedOwner?.label || "—"}
                className="input bg-bg-2 text-ink-3 cursor-default"
              />
              <input type="hidden" name="owner_id" value={selectedOwner?.id || ""} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1.5">負担区分</label>
            <div className="flex rounded-lg border border-line overflow-hidden">
              <button
                type="button"
                onClick={() => setIsOwnerCharge(false)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  !isOwnerCharge
                    ? "bg-accent text-white"
                    : "bg-surface text-ink-3 hover:bg-bg-2"
                }`}
              >
                管理会社負担
              </button>
              <button
                type="button"
                onClick={() => setIsOwnerCharge(true)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  isOwnerCharge
                    ? "bg-warn text-white"
                    : "bg-surface text-ink-3 hover:bg-bg-2"
                }`}
              >
                オーナー負担
              </button>
            </div>
            {isOwnerCharge && (
              <p className="text-[11px] text-warn mt-1">送金時にオーナーへの送金額から控除されます</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">備考</label>
            <textarea
              name="notes"
              defaultValue={editData?.notes || ""}
              className="input"
              rows={2}
              placeholder="メモ"
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
            <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50">
              {loading ? "保存中..." : isEdit ? "更新する" : "登録する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
