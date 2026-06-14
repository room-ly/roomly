"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { contractSchema, type ContractFormData } from "@/lib/schemas";
import type { ZodError } from "zod";
import { dispatchAuditLogRefresh } from "@/lib/audit-events";

interface SelectOption {
  id: string;
  label: string;
  property_id?: string;
  property_name?: string;
  unit_number?: string;
  tenant_id?: string | null;
  rent?: number | null;
  management_fee?: number | null;
  occupied?: boolean;
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
  const initialUnitId = editData?.unit_id || editData?.unit?.id || "";
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId);
  const [selectedTenantId, setSelectedTenantId] = useState(editData?.tenant_id || editData?.tenant?.id || "");
  // 二段階セレクト: まず物件を選び、その物件の空室だけを部屋セレクトに出す
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    units.find((u) => u.id === initialUnitId)?.property_id || ""
  );

  // 物件一覧（重複排除）。物件名順に並べる
  const propertyOptions = (() => {
    const map = new Map<string, string>();
    for (const u of units) {
      if (u.property_id) map.set(u.property_id, u.property_name || "");
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name, "ja")
    );
  })();

  function handlePropertyChange(propertyId: string) {
    setSelectedPropertyId(propertyId);
    // 物件を変えたら部屋選択はリセット（前の物件の部屋が残らないように）
    setSelectedUnitId("");
  }

  function handleUnitChange(unitId: string) {
    setSelectedUnitId(unitId);
    const unit = units.find((u) => u.id === unitId);
    if (unit?.tenant_id) {
      setSelectedTenantId(unit.tenant_id);
    }
    // 新規作成時のみ、部屋の募集条件をフォーム初期値としてコピー
    if (!editData && unit && formRef.current) {
      const setIfEmpty = (name: string, value: string) => {
        const el = formRef.current!.elements.namedItem(name) as
          | HTMLInputElement
          | HTMLSelectElement
          | null;
        if (el && !el.value) el.value = value;
      };
      if (unit.rent != null) setIfEmpty("rent", String(unit.rent));
      if (unit.management_fee != null) setIfEmpty("management_fee", String(unit.management_fee));
    }
  }

  const formRef = useRef<HTMLFormElement>(null);
  // 編集対象が切り替わった時のみフォーム状態をリセットする。
  // 同じ対象の閉じ直しでは入力を保持して、誤クローズで内容を失わないようにする。
  const lastTargetRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const target = editData?.id ?? "__new__";
    if (lastTargetRef.current === target) return;
    lastTargetRef.current = target;

    const unitId = editData?.unit_id || editData?.unit?.id || "";
    setSelectedUnitId(unitId);
    setSelectedPropertyId(units.find((u) => u.id === unitId)?.property_id || "");
    setSelectedTenantId(editData?.tenant_id || editData?.tenant?.id || "");
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
      if (!isEdit) {
        const created = await res.json();
        router.push(`/contracts/${created.id}`);
      } else {
        onClose();
        router.refresh();
        dispatchAuditLogRefresh();
      }
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
      <div className="bg-surface rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-line">
          <h2 className="text-[15px] font-semibold">
            {isEdit ? "契約を編集" : "新規契約"}
          </h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {apiError && (
            <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
              {apiError}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {/* 基本情報 */}
            <fieldset className="space-y-3">
              <legend className="text-[11px] font-mono tracking-wider uppercase text-ink-4 mb-2">基本情報</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">
                    物件 <span className="text-danger">*</span>
                  </label>
                  <select value={selectedPropertyId} onChange={(e) => handlePropertyChange(e.target.value)} className="input">
                    <option value="">選択してください</option>
                    {propertyOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">
                    部屋 <span className="text-danger">*</span>
                  </label>
                  <select name="unit_id" value={selectedUnitId} onChange={(e) => handleUnitChange(e.target.value)} className="input" disabled={!selectedPropertyId}>
                    <option value="">{selectedPropertyId ? "選択してください" : "先に物件を選択"}</option>
                    {units
                      // 選択中の物件 かつ 空室のみ（編集中の契約が紐づく部屋は入居中でも残す）
                      .filter((u) => u.property_id === selectedPropertyId && (!u.occupied || u.id === selectedUnitId))
                      .map((u) => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                  </select>
                  {errors.unit_id && <p className="text-danger text-sm mt-1">{errors.unit_id[0]}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">
                  入居者 <span className="text-danger">*</span>
                </label>
                <select name="tenant_id" value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} className="input">
                  <option value="">選択してください</option>
                  {tenants.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                {errors.tenant_id && <p className="text-danger text-sm mt-1">{errors.tenant_id[0]}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">契約種別 <span className="text-danger">*</span></label>
                  <select name="contract_type" defaultValue={editData?.contract_type || "ordinary"} className="input">
                    <option value="ordinary">普通借家</option>
                    <option value="fixed">定期借家</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">状態 <span className="text-danger">*</span></label>
                  <select name="status" defaultValue={editData?.status || "active"} className="input">
                    <option value="active">有効</option>
                    <option value="pending">準備中</option>
                    <option value="expired">満了</option>
                    <option value="terminated">解約</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {/* 契約期間 */}
            <fieldset className="space-y-3 pt-3 border-t border-line">
              <legend className="text-[11px] font-mono tracking-wider uppercase text-ink-4 mb-2">契約期間</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">契約開始日 <span className="text-danger">*</span></label>
                  <input name="start_date" type="date" defaultValue={editData?.start_date || ""} className="input"
                    onChange={(e) => {
                      const endInput = e.currentTarget.form?.elements.namedItem("end_date") as HTMLInputElement | null;
                      if (endInput && !endInput.value && e.target.value) {
                        const d = new Date(e.target.value);
                        d.setFullYear(d.getFullYear() + 2);
                        d.setDate(d.getDate() - 1);
                        endInput.value = d.toISOString().slice(0, 10);
                      }
                    }}
                  />
                  {errors.start_date && <p className="text-danger text-sm mt-1">{errors.start_date[0]}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">契約終了日</label>
                  <input name="end_date" type="date" defaultValue={editData?.end_date || ""} className="input" />
                  {errors.end_date && <p className="text-danger text-sm mt-1">{errors.end_date[0]}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">退去予定日</label>
                <input name="move_out_date" type="date" defaultValue={editData?.move_out_date || ""} className="input" />
                {errors.move_out_date && <p className="text-danger text-sm mt-1">{errors.move_out_date[0]}</p>}
              </div>
            </fieldset>

            {/* 賃料・費用 */}
            <fieldset className="space-y-3 pt-3 border-t border-line">
              <legend className="text-[11px] font-mono tracking-wider uppercase text-ink-4 mb-2">賃料・費用</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">賃料 <span className="text-danger">*</span></label>
                  <input name="rent" type="number" defaultValue={editData?.rent || ""} className="input" placeholder="例: 80000" />
                  {errors.rent && <p className="text-danger text-sm mt-1">{errors.rent[0]}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">管理費</label>
                  <input name="management_fee" type="number" defaultValue={editData?.management_fee ?? ""} className="input" placeholder="例: 5000" />
                  {errors.management_fee && <p className="text-danger text-sm mt-1">{errors.management_fee[0]}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">敷金</label>
                  <div className="flex gap-2">
                    <input name="deposit" type="number" step="0.01" defaultValue={editData?.deposit ?? ""} className="input min-w-0" style={{ flex: "1 1 0", width: "auto" }} placeholder="例: 80000 / 2" />
                    <select name="deposit_unit" defaultValue={editData?.deposit_unit || "jpy"} className="input shrink-0" style={{ width: "5rem" }}>
                      <option value="jpy">円</option>
                      <option value="months">ヶ月</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">礼金</label>
                  <div className="flex gap-2">
                    <input name="key_money" type="number" step="0.01" defaultValue={editData?.key_money ?? ""} className="input min-w-0" style={{ flex: "1 1 0", width: "auto" }} placeholder="例: 80000 / 1" />
                    <select name="key_money_unit" defaultValue={editData?.key_money_unit || "jpy"} className="input shrink-0" style={{ width: "5rem" }}>
                      <option value="jpy">円</option>
                      <option value="months">ヶ月</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">更新料</label>
                  <div className="flex gap-2">
                    <input name="renewal_fee" type="number" step="0.01" defaultValue={editData?.renewal_fee ?? ""} className="input min-w-0" style={{ flex: "1 1 0", width: "auto" }} placeholder="例: 80000 / 1" />
                    <select name="renewal_fee_unit" defaultValue={editData?.renewal_fee_unit || "jpy"} className="input shrink-0" style={{ width: "5rem" }}>
                      <option value="jpy">円</option>
                      <option value="months">ヶ月</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">支払方法</label>
                  <select name="payment_method" defaultValue={editData?.payment_method || ""} className="input">
                    <option value="">未設定</option>
                    <option value="transfer">銀行振込</option>
                    <option value="debit">口座振替</option>
                    <option value="card">クレジットカード</option>
                    <option value="cash">現金</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">締日（毎月）</label>
                  <select name="closing_day" defaultValue={editData?.closing_day ?? 31} className="input">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d === 31 ? "末日" : `${d}日`}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-ink-4 mt-1">この日が来ると当月分の家賃請求が自動生成されます。</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">支払期日（毎月）</label>
                  <select name="payment_due_day" defaultValue={editData?.payment_due_day ?? 31} className="input">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d === 31 ? "末日" : `${d}日`}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-ink-4 mt-1">月によって存在しない日（2/31等）は月末日として扱われます。</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">支払サイクル</label>
                  <select name="payment_month_offset" defaultValue={editData?.payment_month_offset ?? 1} className="input">
                    <option value="0">当月払い（前家賃）</option>
                    <option value="1">翌月払い（後家賃）</option>
                  </select>
                  <p className="text-[11px] text-ink-4 mt-1">締めた月の家賃を当月内に払うか翌月に払うか。</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">仲介手数料</label>
                <input name="brokerage_fee" type="number" defaultValue={editData?.brokerage_fee ?? ""} className="input" placeholder="例: 80000" />
              </div>
            </fieldset>

            {/* 保証・保険 */}
            <fieldset className="space-y-3 pt-3 border-t border-line">
              <legend className="text-[11px] font-mono tracking-wider uppercase text-ink-4 mb-2">保証・保険</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">保証人</label>
                  <input name="guarantor_name" type="text" defaultValue={editData?.guarantor_name || ""} className="input" placeholder="氏名" />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">保証人電話</label>
                  <input name="guarantor_phone" type="tel" defaultValue={editData?.guarantor_phone || ""} className="input" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">保険会社</label>
                <input name="insurance_company" type="text" defaultValue={editData?.insurance_company || ""} className="input" />
              </div>
            </fieldset>

            {/* 書類・その他 */}
            <fieldset className="space-y-3 pt-3 border-t border-line">
              <legend className="text-[11px] font-mono tracking-wider uppercase text-ink-4 mb-2">書類・その他</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">契約締結日</label>
                  <input name="signed_date" type="date" defaultValue={editData?.signed_date || ""} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">重説実施日</label>
                  <input name="important_explanation_date" type="date" defaultValue={editData?.important_explanation_date || ""} className="input" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">特約事項</label>
                <textarea name="special_terms" defaultValue={editData?.special_terms || ""} className="input" rows={3} placeholder="ペット不可、楽器演奏不可等" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-2 block mb-1">備考</label>
                <textarea name="notes" defaultValue={editData?.notes || ""} className="input" rows={2} />
              </div>
            </fieldset>

            {/* 更新後の条件（契約更新の予約）。既存契約の編集時のみ表示 */}
            {isEdit && (
              <fieldset className="space-y-3 pt-3 border-t border-line">
                <legend className="text-[11px] font-mono tracking-wider uppercase text-ink-4 mb-2">更新後の条件（契約更新）</legend>
                <p className="text-[12px] text-ink-4 -mt-1">
                  更新後の家賃や期間を予約できます。<strong>更新発効日</strong>が来ると、家賃請求は自動で更新後の金額に切り替わります。空欄の項目は現行条件のまま継続します。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-ink-2 block mb-1">更新発効日</label>
                    <input name="renewal_effective_date" type="date" defaultValue={editData?.renewal_effective_date || ""} className="input" />
                    <p className="text-[11px] text-ink-4 mt-1">この日からの新条件。通常は現契約終了日の翌日。</p>
                    {errors.renewal_effective_date && <p className="text-danger text-sm mt-1">{errors.renewal_effective_date[0]}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink-2 block mb-1">更新後の契約終了日</label>
                    <input name="renewal_end_date" type="date" defaultValue={editData?.renewal_end_date || ""} className="input" />
                    {errors.renewal_end_date && <p className="text-danger text-sm mt-1">{errors.renewal_end_date[0]}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-ink-2 block mb-1">更新後の賃料</label>
                    <input name="renewal_rent" type="number" defaultValue={editData?.renewal_rent ?? ""} className="input" placeholder={editData?.rent ? `現行: ${editData.rent}` : "例: 80000"} />
                    {errors.renewal_rent && <p className="text-danger text-sm mt-1">{errors.renewal_rent[0]}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink-2 block mb-1">更新後の管理費</label>
                    <input name="renewal_management_fee" type="number" defaultValue={editData?.renewal_management_fee ?? ""} className="input" placeholder={editData?.management_fee != null ? `現行: ${editData.management_fee}` : "例: 5000"} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink-2 block mb-1">次回更新料</label>
                    <input name="renewal_fee_next" type="number" defaultValue={editData?.renewal_fee_next ?? ""} className="input" placeholder="例: 80000" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-2 block mb-1">更新メモ</label>
                  <textarea name="renewal_notes" defaultValue={editData?.renewal_notes || ""} className="input" rows={2} placeholder="保証会社の更新、特約変更など" />
                </div>
              </fieldset>
            )}

            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={onClose} className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors">
                キャンセル
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "保存中..." : isEdit ? "更新する" : "作成する"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
