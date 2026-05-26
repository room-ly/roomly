"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { tenantSchema, type TenantFormData } from "@/lib/schemas";
import PostalCodeInput from "./PostalCodeInput";
import type { ZodError } from "zod";

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Record<string, any> | null;
}

// 新規追加時の下書きを保存する localStorage キー。
// 作成失敗 → 閉じる → 再オープンしても入力が消えないようにする。
const DRAFT_KEY = "tenant_form_draft";

// フォームで扱う全フィールド。下書き保存・復元の対象。
const FIELD_KEYS = [
  "name", "name_kana", "date_of_birth", "gender", "nationality",
  "phone", "email", "postal_code", "address",
  "workplace", "workplace_phone", "annual_income",
  "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relation",
  "guarantee_type", "guarantee_company_name", "guarantee_contract_number", "guarantee_fee",
  "guarantor_name", "guarantor_name_kana", "guarantor_date_of_birth", "guarantor_phone",
  "guarantor_relation", "guarantor_postal_code", "guarantor_address",
  "guarantor_workplace", "guarantor_workplace_phone", "guarantor_annual_income",
  "notes",
] as const;

type FormState = Record<string, string>;

function buildInitialState(editData?: Record<string, any> | null): FormState {
  const s: FormState = {};
  for (const k of FIELD_KEYS) {
    const v = editData?.[k];
    s[k] = v === null || v === undefined ? "" : String(v);
  }
  // 保証方式の既定値は「保証会社」
  if (!s.guarantee_type) s.guarantee_type = "company";
  return s;
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
  const isEdit = !!editData;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");
  const [form, setForm] = useState<FormState>(() => buildInitialState(editData));

  // オープン時に状態を初期化。新規時は localStorage の下書きを復元する。
  useEffect(() => {
    if (!isOpen) return;
    let initial = buildInitialState(editData);
    if (!isEdit && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) initial = { ...initial, ...JSON.parse(saved) };
      } catch {
        // 壊れた下書きは無視
      }
    }
    setForm(initial);
    setErrors({});
    setApiError("");
    // editData の id 単位で初期化（同じモーダルの使い回しに対応）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData?.id]);

  if (!isOpen) return null;

  function set(key: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // 新規時のみ下書きを保存
      if (!isEdit && typeof window !== "undefined") {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        } catch {
          // 容量超過等は無視
        }
      }
      return next;
    });
  }

  function clearDraft() {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // 無視
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setApiError("");

    try {
      const parsed = tenantSchema.parse(form) as TenantFormData;
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

      // 成功時のみ下書きを破棄
      clearDraft();
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

  const guaranteeType = form.guarantee_type;

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
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="例: 山田太郎" />
              {errors.name && <p className="text-danger text-sm mt-1">{errors.name[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">フリガナ</label>
              <input value={form.name_kana} onChange={(e) => set("name_kana", e.target.value)} className="input" placeholder="例: ヤマダタロウ" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">生年月日</label>
              <input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">性別</label>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="input">
                <option value="">未選択</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">国籍</label>
              <input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} className="input" placeholder="例: 日本" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">電話番号</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" placeholder="例: 09012345678" />
              {errors.phone && <p className="text-danger text-sm mt-1">{errors.phone[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">メール</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input" placeholder="例: yamada@example.com" />
              {errors.email && <p className="text-danger text-sm mt-1">{errors.email[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">郵便番号</label>
              <PostalCodeInput
                value={form.postal_code}
                onChange={(v) => set("postal_code", v)}
                placeholder="例: 1600022"
                onResolved={(r) => set("address", r.address)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">住所</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className="input" placeholder="例: 東京都新宿区新宿1-1-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">勤務先</label>
              <input value={form.workplace} onChange={(e) => set("workplace", e.target.value)} className="input" placeholder="例: 株式会社サンプル" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">勤務先電話</label>
              <input value={form.workplace_phone} onChange={(e) => set("workplace_phone", e.target.value)} className="input" placeholder="例: 0312345678" />
              {errors.workplace_phone && <p className="text-danger text-sm mt-1">{errors.workplace_phone[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">年収（万円）</label>
              <input type="number" value={form.annual_income} onChange={(e) => set("annual_income", e.target.value)} className="input" placeholder="例: 500" />
              {errors.annual_income && <p className="text-danger text-sm mt-1">{errors.annual_income[0]}</p>}
            </div>
          </div>

          {/* ── 緊急連絡先 ── */}
          <SectionLabel>緊急連絡先</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">氏名</label>
              <input value={form.emergency_contact_name} onChange={(e) => set("emergency_contact_name", e.target.value)} className="input" placeholder="例: 山田花子" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">電話番号</label>
              <input value={form.emergency_contact_phone} onChange={(e) => set("emergency_contact_phone", e.target.value)} className="input" placeholder="例: 0312345678" />
              {errors.emergency_contact_phone && <p className="text-danger text-sm mt-1">{errors.emergency_contact_phone[0]}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">続柄</label>
              <input value={form.emergency_contact_relation} onChange={(e) => set("emergency_contact_relation", e.target.value)} className="input" placeholder="例: 母" />
            </div>
          </div>

          {/* ── 保証 ── */}
          <SectionLabel>保証</SectionLabel>
          <div className="max-w-xs">
            <label className="text-sm font-medium text-ink-2 block mb-1">保証方式</label>
            <select
              value={guaranteeType}
              onChange={(e) => set("guarantee_type", e.target.value)}
              className="input"
            >
              <option value="company">保証会社</option>
              <option value="individual">個人連帯保証</option>
              <option value="none">なし</option>
            </select>
          </div>

          {/* 保証会社の場合 */}
          {guaranteeType === "company" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">保証会社名</label>
                <input value={form.guarantee_company_name} onChange={(e) => set("guarantee_company_name", e.target.value)} className="input" placeholder="例: 全保連株式会社" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">契約番号</label>
                <input value={form.guarantee_contract_number} onChange={(e) => set("guarantee_contract_number", e.target.value)} className="input" placeholder="例: AB-12345678" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">保証料（円）</label>
                <input type="number" value={form.guarantee_fee} onChange={(e) => set("guarantee_fee", e.target.value)} className="input" placeholder="例: 50000" />
                {errors.guarantee_fee && <p className="text-danger text-sm mt-1">{errors.guarantee_fee[0]}</p>}
              </div>
            </div>
          )}

          {/* 個人連帯保証の場合 */}
          {guaranteeType === "individual" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">氏名</label>
                  <input value={form.guarantor_name} onChange={(e) => set("guarantor_name", e.target.value)} className="input" placeholder="例: 山田一郎" />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">フリガナ</label>
                  <input value={form.guarantor_name_kana} onChange={(e) => set("guarantor_name_kana", e.target.value)} className="input" placeholder="例: ヤマダイチロウ" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">生年月日</label>
                  <input type="date" value={form.guarantor_date_of_birth} onChange={(e) => set("guarantor_date_of_birth", e.target.value)} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">電話番号</label>
                  <input value={form.guarantor_phone} onChange={(e) => set("guarantor_phone", e.target.value)} className="input" placeholder="例: 0312345678" />
                  {errors.guarantor_phone && <p className="text-danger text-sm mt-1">{errors.guarantor_phone[0]}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">続柄</label>
                  <input value={form.guarantor_relation} onChange={(e) => set("guarantor_relation", e.target.value)} className="input" placeholder="例: 父" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">郵便番号</label>
                  <PostalCodeInput
                    value={form.guarantor_postal_code}
                    onChange={(v) => set("guarantor_postal_code", v)}
                    placeholder="例: 1600022"
                    onResolved={(r) => set("guarantor_address", r.address)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">住所</label>
                  <input value={form.guarantor_address} onChange={(e) => set("guarantor_address", e.target.value)} className="input" placeholder="例: 東京都新宿区..." />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">勤務先</label>
                  <input value={form.guarantor_workplace} onChange={(e) => set("guarantor_workplace", e.target.value)} className="input" placeholder="例: 株式会社サンプル" />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">勤務先電話</label>
                  <input value={form.guarantor_workplace_phone} onChange={(e) => set("guarantor_workplace_phone", e.target.value)} className="input" placeholder="例: 0312345678" />
                  {errors.guarantor_workplace_phone && <p className="text-danger text-sm mt-1">{errors.guarantor_workplace_phone[0]}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">年収（万円）</label>
                  <input type="number" value={form.guarantor_annual_income} onChange={(e) => set("guarantor_annual_income", e.target.value)} className="input" placeholder="例: 600" />
                  {errors.guarantor_annual_income && <p className="text-danger text-sm mt-1">{errors.guarantor_annual_income[0]}</p>}
                </div>
              </div>
            </>
          )}

          {/* ── 備考 ── */}
          <SectionLabel>備考</SectionLabel>
          <div>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="input" rows={3} placeholder="自由入力" />
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
