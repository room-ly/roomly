"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { contractSchema, type ContractFormData } from "@/lib/schemas";
import type { ZodError } from "zod";

interface SelectOption {
  id: string;
  label: string;
}

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: SelectOption[];
  tenants: SelectOption[];
  editData?: Record<string, any> | null;
}

export default function ContractFormModal({
  isOpen,
  onClose,
  units,
  tenants,
  editData,
}: ContractFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");

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
      const parsed = contractSchema.parse(data) as ContractFormData;
      setLoading(true);

      const url = isEdit
        ? `/api/contracts/${editData!.id}`
        : "/api/contracts";
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
            {isEdit ? "契約を編集" : "新規契約"}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                部屋 <span className="text-danger">*</span>
              </label>
              <select
                name="unit_id"
                defaultValue={editData?.unit_id || ""}
                className="input"
              >
                <option value="">選択してください</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
              {errors.unit_id && (
                <p className="text-danger text-sm mt-1">{errors.unit_id[0]}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                入居者 <span className="text-danger">*</span>
              </label>
              <select
                name="tenant_id"
                defaultValue={editData?.tenant_id || ""}
                className="input"
              >
                <option value="">選択してください</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.tenant_id && (
                <p className="text-danger text-sm mt-1">
                  {errors.tenant_id[0]}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                契約種別 <span className="text-danger">*</span>
              </label>
              <select
                name="contract_type"
                defaultValue={editData?.contract_type || "ordinary"}
                className="input"
              >
                <option value="ordinary">普通借家</option>
                <option value="fixed">定期借家</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                状態 <span className="text-danger">*</span>
              </label>
              <select
                name="status"
                defaultValue={editData?.status || "active"}
                className="input"
              >
                <option value="active">有効</option>
                <option value="pending">準備中</option>
                <option value="expired">満了</option>
                <option value="terminated">解約</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                契約開始日 <span className="text-danger">*</span>
              </label>
              <input
                name="start_date"
                type="date"
                defaultValue={editData?.start_date || ""}
                className="input"
              />
              {errors.start_date && (
                <p className="text-danger text-sm mt-1">
                  {errors.start_date[0]}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                契約終了日
              </label>
              <input
                name="end_date"
                type="date"
                defaultValue={editData?.end_date || ""}
                className="input"
              />
              {errors.end_date && (
                <p className="text-danger text-sm mt-1">
                  {errors.end_date[0]}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                賃料 <span className="text-danger">*</span>
              </label>
              <input
                name="rent"
                type="number"
                defaultValue={editData?.rent || ""}
                className="input"
                placeholder="例: 80000"
              />
              {errors.rent && (
                <p className="text-danger text-sm mt-1">{errors.rent[0]}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                管理費
              </label>
              <input
                name="management_fee"
                type="number"
                defaultValue={editData?.management_fee ?? "0"}
                className="input"
                placeholder="例: 5000"
              />
              {errors.management_fee && (
                <p className="text-danger text-sm mt-1">
                  {errors.management_fee[0]}
                </p>
              )}
            </div>
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
              {loading ? "保存中..." : isEdit ? "更新する" : "作成する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
