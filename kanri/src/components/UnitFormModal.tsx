"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { unitSchema, type UnitFormData } from "@/lib/schemas";
import type { ZodError } from "zod";

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  editData?: Record<string, any> | null;
}

export default function UnitFormModal({
  isOpen,
  onClose,
  propertyId,
  editData,
}: UnitFormModalProps) {
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
      const parsed = unitSchema.parse(data) as UnitFormData;
      setLoading(true);

      const url = isEdit ? `/api/units/${editData!.id}` : "/api/units";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed, property_id: propertyId }),
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
            {isEdit ? "部屋を編集" : "部屋を追加"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                部屋番号 <span className="text-danger">*</span>
              </label>
              <input
                name="unit_number"
                defaultValue={editData?.unit_number || ""}
                className="input"
                placeholder="例: 101"
              />
              {errors.unit_number && (
                <p className="text-danger text-sm mt-1">
                  {errors.unit_number[0]}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                階
              </label>
              <input
                name="floor"
                type="number"
                defaultValue={editData?.floor || ""}
                className="input"
                placeholder="例: 1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                間取り
              </label>
              <input
                name="layout"
                defaultValue={editData?.layout || ""}
                className="input"
                placeholder="例: 1LDK"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                面積(m2)
              </label>
              <input
                name="area_sqm"
                type="number"
                step="0.01"
                defaultValue={editData?.area_sqm || ""}
                className="input"
                placeholder="例: 35.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                管理費 <span className="text-danger">*</span>
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

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              状態 <span className="text-danger">*</span>
            </label>
            <select
              name="status"
              defaultValue={editData?.status || "vacant"}
              className="input"
            >
              <option value="vacant">空室</option>
              <option value="occupied">入居中</option>
              <option value="reserved">申込中</option>
              <option value="maintenance">メンテ中</option>
            </select>
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
