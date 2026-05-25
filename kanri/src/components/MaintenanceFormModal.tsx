"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { maintenanceSchema, type MaintenanceFormData } from "@/lib/schemas";
import { createClient } from "@/lib/supabase";
import type { ZodError } from "zod";

interface SelectOption {
  id: string;
  label: string;
}

interface MaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: SelectOption[];
  editData?: Record<string, any> | null;
}

export default function MaintenanceFormModal({
  isOpen,
  onClose,
  properties,
  editData,
}: MaintenanceFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    editData?.property_id || ""
  );
  const [units, setUnits] = useState<SelectOption[]>([]);

  // 物件が選択されたら部屋を取得
  useEffect(() => {
    if (!selectedPropertyId) {
      setUnits([]);
      return;
    }
    const supabase = createClient();
    supabase
      .from("units")
      .select("id, unit_number")
      .eq("property_id", selectedPropertyId)
      .order("unit_number")
      .then(({ data }) => {
        setUnits(
          (data || []).map((u: any) => ({
            id: u.id,
            label: u.unit_number,
          }))
        );
      });
  }, [selectedPropertyId]);

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
      const parsed = maintenanceSchema.parse(data) as MaintenanceFormData;
      setLoading(true);

      const url = isEdit
        ? `/api/maintenance/${editData!.id}`
        : "/api/maintenance";
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
            {isEdit ? "修繕依頼を編集" : "修繕依頼を登録"}
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
                物件 <span className="text-danger">*</span>
              </label>
              <select
                name="property_id"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="input"
              >
                <option value="">選択してください</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              {errors.property_id && (
                <p className="text-danger text-sm mt-1">
                  {errors.property_id[0]}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                部屋
              </label>
              <select
                name="unit_id"
                defaultValue={editData?.unit_id || ""}
                className="input"
              >
                <option value="">共用部</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              件名 <span className="text-danger">*</span>
            </label>
            <input
              name="title"
              defaultValue={editData?.title || ""}
              className="input"
              placeholder="例: 水漏れ修理"
            />
            {errors.title && (
              <p className="text-danger text-sm mt-1">{errors.title[0]}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              詳細
            </label>
            <textarea
              name="description"
              defaultValue={editData?.description || ""}
              className="input min-h-[80px]"
              placeholder="状況の詳細を入力..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                カテゴリ <span className="text-danger">*</span>
              </label>
              <select
                name="category"
                defaultValue={editData?.category || ""}
                className="input"
              >
                <option value="">選択してください</option>
                <option value="plumbing">水回り</option>
                <option value="electrical">電気</option>
                <option value="structural">構造</option>
                <option value="equipment">設備</option>
                <option value="other">その他</option>
              </select>
              {errors.category && (
                <p className="text-danger text-sm mt-1">
                  {errors.category[0]}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                優先度 <span className="text-danger">*</span>
              </label>
              <select
                name="priority"
                defaultValue={editData?.priority || "normal"}
                className="input"
              >
                <option value="low">低</option>
                <option value="normal">通常</option>
                <option value="high">高</option>
                <option value="urgent">緊急</option>
              </select>
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                状態
              </label>
              <select
                name="status"
                defaultValue={editData?.status || "open"}
                className="input"
              >
                <option value="open">未対応</option>
                <option value="in_progress">対応中</option>
                <option value="waiting_parts">部品待ち</option>
                <option value="completed">完了</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                業者名
              </label>
              <input
                name="vendor_name"
                defaultValue={editData?.vendor_name || ""}
                className="input"
                placeholder="例: 東京メンテナンス"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                見積額
              </label>
              <input
                name="estimated_cost"
                type="number"
                defaultValue={editData?.estimated_cost || ""}
                className="input"
                placeholder="例: 50000"
              />
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
              {loading ? "保存中..." : isEdit ? "更新する" : "登録する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
