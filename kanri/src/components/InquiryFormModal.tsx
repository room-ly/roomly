"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { inquirySchema, type InquiryFormData } from "@/lib/schemas";
import type { ZodError } from "zod";

interface SelectOption {
  id: string;
  label: string;
  tenant_id?: string | null;
}

interface InquiryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Record<string, any> | null;
  defaultData?: Record<string, any> | null;
  properties?: SelectOption[];
  units?: SelectOption[];
  tenants?: SelectOption[];
}

export default function InquiryFormModal({
  isOpen,
  onClose,
  editData,
  defaultData,
  properties = [],
  units = [],
  tenants = [],
}: InquiryFormModalProps) {
  const router = useRouter();
  const initial = editData || defaultData;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(initial?.property_id || "");
  const [selectedUnitId, setSelectedUnitId] = useState(initial?.unit_id || "");
  const [selectedType, setSelectedType] = useState(initial?.inquiry_type || "other");
  const [selectedTenantId, setSelectedTenantId] = useState(() => {
    if (initial?.tenant_id) return initial.tenant_id;
    if (initial?.unit_id) {
      return units.find((u) => u.id === initial.unit_id)?.tenant_id || "";
    }
    return "";
  });

  const filteredUnits = useMemo(() => {
    if (!selectedPropertyId) return units;
    return units.filter((u) => u.label.startsWith(
      properties.find((p) => p.id === selectedPropertyId)?.label || ""
    ));
  }, [selectedPropertyId, units, properties]);

  function handlePropertyChange(propertyId: string) {
    setSelectedPropertyId(propertyId);
    setSelectedUnitId("");
    setSelectedTenantId("");
  }

  function handleUnitChange(unitId: string) {
    setSelectedUnitId(unitId);
    const unit = units.find((u) => u.id === unitId);
    setSelectedTenantId(unit?.tenant_id || "");
  }

  const unitTenantId = units.find((u) => u.id === selectedUnitId)?.tenant_id;
  const tenantLocked = !!unitTenantId;

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
      const parsed = inquirySchema.parse(data) as InquiryFormData;
      setLoading(true);

      const url = isEdit
        ? `/api/inquiries/${editData!.id}`
        : "/api/inquiries";
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
            {isEdit ? "問い合わせを編集" : "問い合わせを登録"}
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
              件名 <span className="text-danger">*</span>
            </label>
            <input
              name="title"
              defaultValue={editData?.title || ""}
              className="input"
              placeholder="例: 騒音の苦情"
            />
            {errors.title && (
              <p className="text-danger text-sm mt-1">{errors.title[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                物件
              </label>
              <select
                name="property_id"
                value={selectedPropertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="input"
              >
                <option value="">未選択</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                部屋
              </label>
              <select
                name="unit_id"
                value={selectedUnitId}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="input"
              >
                <option value="">未選択</option>
                {filteredUnits.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                入居者
              </label>
              {tenantLocked ? (
                <>
                  <input type="hidden" name="tenant_id" value={selectedTenantId} />
                  <div className="input bg-bg-2 text-ink-2">
                    {tenants.find((t) => t.id === selectedTenantId)?.label || "—"}
                  </div>
                </>
              ) : (
                <select
                  name="tenant_id"
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="input"
                >
                  <option value="">未選択</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                種別 <span className="text-danger">*</span>
              </label>
              <select
                name="inquiry_type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input"
              >
                <option value="maintenance">修繕</option>
                <option value="move_out">退去</option>
                <option value="complaint">クレーム</option>
                <option value="other">その他</option>
              </select>
              {errors.inquiry_type && (
                <p className="text-danger text-sm mt-1">
                  {errors.inquiry_type[0]}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                優先度
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
                <option value="resolved">解決済</option>
                <option value="closed">クローズ</option>
              </select>
            </div>
          )}

          {selectedType === "move_out" && (
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                退去予定日 <span className="text-danger">*</span>
              </label>
              <input
                name="move_out_date"
                type="date"
                defaultValue={editData?.move_out_date || ""}
                className="input"
              />
              {errors.move_out_date && (
                <p className="text-danger text-sm mt-1">{errors.move_out_date[0]}</p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              詳細
            </label>
            <textarea
              name="description"
              defaultValue={editData?.description || ""}
              className="input min-h-[80px]"
              placeholder="問い合わせの詳細を入力..."
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
              {loading ? "保存中..." : isEdit ? "更新する" : "登録する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
