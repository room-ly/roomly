"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { ownerSchema, type OwnerFormData } from "@/lib/schemas";
import type { ZodError } from "zod";
import BankSuggest from "./BankSuggest";
import PostalCodeInput from "./PostalCodeInput";

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
  const [address, setAddress] = useState(editData?.address || "");
  const [mailingAddress, setMailingAddress] = useState(editData?.mailing_address || "");
  const [ownerType, setOwnerType] = useState<"individual" | "corporate">(
    (editData?.owner_type as "individual" | "corporate") || "individual"
  );

  const formRef = useRef<HTMLFormElement>(null);
  // 編集対象が切り替わった時のみフォーム状態をリセットする。
  // 同じ対象の閉じ直しでは入力を保持して、誤クローズで内容を失わないようにする。
  const lastTargetRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const target = editData?.id ?? "__new__";
    if (lastTargetRef.current === target) return;
    lastTargetRef.current = target;

    setBankName(editData?.bank_name || "");
    setBankCode(editData?.bank_code || "");
    setBranchName(editData?.bank_branch || "");
    setBranchCode(editData?.bank_branch_code || "");
    setAddress(editData?.address || "");
    setMailingAddress(editData?.mailing_address || "");
    setOwnerType((editData?.owner_type as "individual" | "corporate") || "individual");
    setErrors({});
    setApiError("");
    formRef.current?.reset();
  }, [isOpen, editData]);

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

      // 登録/更新が完了したらドラフトをリセット
      lastTargetRef.current = null;
      formRef.current?.reset();
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
      style={{ display: isOpen ? "flex" : "none" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">区分</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="owner_type"
                  value="individual"
                  checked={ownerType === "individual"}
                  onChange={() => setOwnerType("individual")}
                />
                個人
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="owner_type"
                  value="corporate"
                  checked={ownerType === "corporate"}
                  onChange={() => setOwnerType("corporate")}
                />
                法人
              </label>
            </div>
          </div>

          {ownerType === "corporate" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  法人名
                </label>
                <input
                  name="company_name"
                  defaultValue={editData?.company_name || ""}
                  className="input"
                  placeholder="例: 株式会社山田不動産"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  法人名（カナ）
                </label>
                <input
                  name="company_name_kana"
                  defaultValue={editData?.company_name_kana || ""}
                  className="input"
                  placeholder="例: カブシキガイシャヤマダフドウサン"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  代表者氏名
                </label>
                <input
                  name="representative_name"
                  defaultValue={editData?.representative_name || ""}
                  className="input"
                  placeholder="例: 山田太郎"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                {ownerType === "corporate" ? "担当者氏名" : "氏名"}
                <span className="text-danger"> *</span>
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
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                フリガナ
              </label>
              <input
                name="name_kana"
                defaultValue={editData?.name_kana || ""}
                className="input"
                placeholder="例: ヤマダタロウ"
              />
            </div>
          </div>

          {ownerType === "individual" && (
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                生年月日
              </label>
              <input
                name="birth_date"
                type="date"
                defaultValue={editData?.birth_date || ""}
                className="input sm:max-w-[14rem]"
              />
              <p className="text-xs text-ink-3 mt-1">
                年欄をクリックして西暦4桁（例: 1960）を直接入力すると素早く入力できます
              </p>
            </div>
          )}

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
                携帯電話
              </label>
              <input
                name="mobile_phone"
                defaultValue={editData?.mobile_phone || ""}
                className="input"
                placeholder="例: 09012345678"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">FAX</label>
              <input
                name="fax"
                defaultValue={editData?.fax || ""}
                className="input"
                placeholder="例: 0312345679"
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
              <PostalCodeInput
                defaultValue={editData?.postal_code || ""}
                onResolved={(r) => setAddress(r.address)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                住所
              </label>
              <input
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input"
                placeholder="例: 東京都新宿区西新宿1-1-1"
              />
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <h3 className="text-[13px] font-medium text-ink-2 mb-3">
              書類送付先（住所と異なる場合）
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  送付先郵便番号
                </label>
                <PostalCodeInput
                  name="mailing_postal_code"
                  defaultValue={editData?.mailing_postal_code || ""}
                  onResolved={(r) => setMailingAddress(r.address)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  送付先住所
                </label>
                <input
                  name="mailing_address"
                  value={mailingAddress}
                  onChange={(e) => setMailingAddress(e.target.value)}
                  className="input"
                  placeholder="例: 神奈川県横浜市..."
                />
              </div>
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <h3 className="text-[13px] font-medium text-ink-2 mb-3">緊急連絡先</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  氏名
                </label>
                <input
                  name="emergency_contact_name"
                  defaultValue={editData?.emergency_contact_name || ""}
                  className="input"
                  placeholder="例: 山田花子"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  続柄
                </label>
                <input
                  name="emergency_contact_relation"
                  defaultValue={editData?.emergency_contact_relation || ""}
                  className="input"
                  placeholder="例: 配偶者"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  電話番号
                </label>
                <input
                  name="emergency_contact_phone"
                  defaultValue={editData?.emergency_contact_phone || ""}
                  className="input"
                  placeholder="例: 09012345678"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <h3 className="text-[13px] font-medium text-ink-2 mb-3">税務情報</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  インボイス登録番号
                </label>
                <input
                  name="invoice_number"
                  defaultValue={editData?.invoice_number || ""}
                  className="input"
                  placeholder="例: T1234567890123"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="withholding_required"
                    value="true"
                    defaultChecked={!!editData?.withholding_required}
                  />
                  源泉徴収が必要（非居住者など）
                </label>
              </div>
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
                  <option value="貯蓄">貯蓄</option>
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
                  口座名義
                </label>
                <input
                  name="bank_account_holder"
                  defaultValue={editData?.bank_account_holder || ""}
                  className="input"
                  placeholder="例: 山田 太郎"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  口座名義（カナ）
                </label>
                <input
                  name="bank_account_holder_kana"
                  defaultValue={editData?.bank_account_holder_kana || ""}
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
              className="btn btn-primary disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "保存中..." : isEdit ? "更新する" : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
