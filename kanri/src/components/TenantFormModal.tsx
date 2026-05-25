"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { tenantSchema, type TenantFormData } from "@/lib/schemas";
import type { ZodError } from "zod";

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Record<string, any> | null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[13px] font-semibold text-ink-2 border-b border-line pb-1 mb-3 mt-5 first:mt-0">
      {children}
    </div>
  );
}

export default function TenantFormModal({
  isOpen,
  onClose,
  editData,
}: TenantFormModalProps) {
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
      const parsed = tenantSchema.parse(data) as TenantFormData;
      setLoading(true);

      const url = isEdit ? `/api/tenants/${editData!.id}` : "/api/tenants";
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
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold">
            {isEdit ? "入居者を編集" : "入居者を追加"}
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

        <form onSubmit={handleSubmit} className="space-y-1">
          {/* ── 基本情報 ── */}
          <SectionLabel>基本情報</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                氏名 <span className="text-danger">*</span>
              </label>
              <input name="name" defaultValue={editData?.name || ""} className="input" placeholder="例: 山田太郎" />
              {errors.name && <p className="text-danger text-sm mt-1">{errors.name[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">フリガナ</label>
              <input name="name_kana" defaultValue={editData?.name_kana || ""} className="input" placeholder="例: ヤマダタロウ" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">生年月日</label>
              <input name="date_of_birth" type="date" defaultValue={editData?.date_of_birth || ""} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">性別</label>
              <select name="gender" defaultValue={editData?.gender || ""} className="input">
                <option value="">未選択</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">国籍</label>
              <input name="nationality" defaultValue={editData?.nationality || ""} className="input" placeholder="例: 日本" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">電話番号</label>
              <input name="phone" defaultValue={editData?.phone || ""} className="input" placeholder="例: 09012345678" />
              {errors.phone && <p className="text-danger text-sm mt-1">{errors.phone[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">メール</label>
              <input name="email" type="email" defaultValue={editData?.email || ""} className="input" placeholder="例: yamada@example.com" />
              {errors.email && <p className="text-danger text-sm mt-1">{errors.email[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">郵便番号</label>
              <input name="postal_code" defaultValue={editData?.postal_code || ""} className="input" placeholder="例: 1600022" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">住所</label>
              <input name="address" defaultValue={editData?.address || ""} className="input" placeholder="例: 東京都新宿区新宿1-1-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">勤務先</label>
              <input name="workplace" defaultValue={editData?.workplace || ""} className="input" placeholder="例: 株式会社サンプル" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">勤務先電話</label>
              <input name="workplace_phone" defaultValue={editData?.workplace_phone || ""} className="input" placeholder="例: 0312345678" />
              {errors.workplace_phone && <p className="text-danger text-sm mt-1">{errors.workplace_phone[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">年収</label>
              <input name="annual_income" type="number" defaultValue={editData?.annual_income || ""} className="input" placeholder="例: 5000000" />
              {errors.annual_income && <p className="text-danger text-sm mt-1">{errors.annual_income[0]}</p>}
            </div>
          </div>

          {/* ── 緊急連絡先 ── */}
          <SectionLabel>緊急連絡先</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">氏名</label>
              <input name="emergency_contact_name" defaultValue={editData?.emergency_contact_name || ""} className="input" placeholder="例: 山田花子" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">電話番号</label>
              <input name="emergency_contact_phone" defaultValue={editData?.emergency_contact_phone || ""} className="input" placeholder="例: 0312345678" />
              {errors.emergency_contact_phone && <p className="text-danger text-sm mt-1">{errors.emergency_contact_phone[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">続柄</label>
              <input name="emergency_contact_relation" defaultValue={editData?.emergency_contact_relation || ""} className="input" placeholder="例: 母" />
            </div>
          </div>

          {/* ── 保証人情報 ── */}
          <SectionLabel>保証人情報</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">氏名</label>
              <input name="guarantor_name" defaultValue={editData?.guarantor_name || ""} className="input" placeholder="例: 山田一郎" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">フリガナ</label>
              <input name="guarantor_name_kana" defaultValue={editData?.guarantor_name_kana || ""} className="input" placeholder="例: ヤマダイチロウ" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">生年月日</label>
              <input name="guarantor_date_of_birth" type="date" defaultValue={editData?.guarantor_date_of_birth || ""} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">電話番号</label>
              <input name="guarantor_phone" defaultValue={editData?.guarantor_phone || ""} className="input" placeholder="例: 0312345678" />
              {errors.guarantor_phone && <p className="text-danger text-sm mt-1">{errors.guarantor_phone[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">続柄</label>
              <input name="guarantor_relation" defaultValue={editData?.guarantor_relation || ""} className="input" placeholder="例: 父" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">住所</label>
            <input name="guarantor_address" defaultValue={editData?.guarantor_address || ""} className="input" placeholder="例: 東京都新宿区..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">勤務先</label>
              <input name="guarantor_workplace" defaultValue={editData?.guarantor_workplace || ""} className="input" placeholder="例: 株式会社サンプル" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">勤務先電話</label>
              <input name="guarantor_workplace_phone" defaultValue={editData?.guarantor_workplace_phone || ""} className="input" placeholder="例: 0312345678" />
              {errors.guarantor_workplace_phone && <p className="text-danger text-sm mt-1">{errors.guarantor_workplace_phone[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">年収</label>
              <input name="guarantor_annual_income" type="number" defaultValue={editData?.guarantor_annual_income || ""} className="input" placeholder="例: 6000000" />
              {errors.guarantor_annual_income && <p className="text-danger text-sm mt-1">{errors.guarantor_annual_income[0]}</p>}
            </div>
          </div>

          {/* ── 備考 ── */}
          <SectionLabel>備考</SectionLabel>
          <div>
            <textarea name="notes" defaultValue={editData?.notes || ""} className="input" rows={3} placeholder="自由入力" />
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
