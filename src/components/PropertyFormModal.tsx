"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { propertySchema, type PropertyFormData } from "@/lib/schemas";
import type { ZodError } from "zod";

interface Owner {
  id: string;
  name: string;
}

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  owners: Owner[];
  editData?: Record<string, any> | null;
}

export default function PropertyFormModal({
  isOpen,
  onClose,
  owners,
  editData,
}: PropertyFormModalProps) {
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
      const parsed = propertySchema.parse(data) as PropertyFormData;
      setLoading(true);

      const url = isEdit
        ? `/api/properties/${editData!.id}`
        : "/api/properties";
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
      <div className="bg-card rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold">
            {isEdit ? "物件を編集" : "物件を追加"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {apiError && (
          <div className="bg-danger-bg text-danger text-sm rounded-lg px-3 py-2 mb-4">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1">
              物件名 <span className="text-danger">*</span>
            </label>
            <input
              name="name"
              defaultValue={editData?.name || ""}
              className="input"
              placeholder="例: サンシャインマンション"
            />
            {errors.name && (
              <p className="text-danger text-sm mt-1">{errors.name[0]}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-text-secondary block mb-1">
              住所 <span className="text-danger">*</span>
            </label>
            <input
              name="address"
              defaultValue={editData?.address || ""}
              className="input"
              placeholder="例: 東京都新宿区西新宿1-1-1"
            />
            {errors.address && (
              <p className="text-danger text-sm mt-1">{errors.address[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-1">
                物件種別 <span className="text-danger">*</span>
              </label>
              <select
                name="property_type"
                defaultValue={editData?.property_type || "apartment"}
                className="input"
              >
                <option value="apartment">マンション</option>
                <option value="house">戸建て</option>
                <option value="commercial">商業</option>
                <option value="parking">駐車場</option>
              </select>
              {errors.property_type && (
                <p className="text-danger text-sm mt-1">
                  {errors.property_type[0]}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary block mb-1">
                オーナー
              </label>
              <select
                name="owner_id"
                defaultValue={editData?.owner_id || ""}
                className="input"
              >
                <option value="">選択してください</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-1">
                構造
              </label>
              <input
                name="structure"
                defaultValue={editData?.structure || ""}
                className="input"
                placeholder="例: RC造"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-1">
                築年
              </label>
              <input
                name="built_year"
                type="number"
                defaultValue={editData?.built_year || ""}
                className="input"
                placeholder="例: 2020"
              />
              {errors.built_year && (
                <p className="text-danger text-sm mt-1">
                  {errors.built_year[0]}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-1">
                階数
              </label>
              <input
                name="floors"
                type="number"
                defaultValue={editData?.floors || ""}
                className="input"
                placeholder="例: 5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-1">
                最寄り駅
              </label>
              <input
                name="nearest_station"
                defaultValue={editData?.nearest_station || ""}
                className="input"
                placeholder="例: 新宿駅"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-1">
                徒歩(分)
              </label>
              <input
                name="walk_minutes"
                type="number"
                defaultValue={editData?.walk_minutes || ""}
                className="input"
                placeholder="例: 5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-bg-secondary text-text-secondary rounded-lg px-4 py-2 text-sm hover:bg-border-light transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? "保存中..." : isEdit ? "更新する" : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
