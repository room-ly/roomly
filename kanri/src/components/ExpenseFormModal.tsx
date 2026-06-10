"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import {
  expenseSchema,
  PAID_BY_OPTIONS,
  PAID_BY_LABELS,
  type AllocationMethod,
  type PaidBy,
  type TaxCategory,
} from "@/lib/schemas-expense";
import type { ZodError } from "zod";
import { dispatchAuditLogRefresh } from "@/lib/audit-events";
import SplitModeSection from "./expense-form/SplitModeSection";
import AllocationSection, { type AllocationDraft } from "./expense-form/AllocationSection";
import MetaFields from "./expense-form/MetaFields";

interface SelectOption {
  id: string;
  label: string;
  owner_id?: string;
  default_allocation_method?: string | null;
}

interface PayeeOption {
  id: string;
  label: string;
  category?: string;
}

export type CaseOption = {
  id: string;
  label: string;
  property_id?: string | null;
};

export type ContractOption = {
  id: string;
  label: string;
  unit_id?: string | null;
  deposit?: number | null;
};

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: SelectOption[];
  owners: SelectOption[];
  payees?: PayeeOption[];
  cases?: CaseOption[];
  contracts?: ContractOption[];
  editData?: Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const num = (v: unknown) => Number(v ?? 0) || 0;

export default function ExpenseFormModal({
  isOpen,
  onClose,
  properties,
  owners,
  payees = [],
  cases = [],
  contracts = [],
  editData,
}: ExpenseFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");

  const [amount, setAmount] = useState<number>(num(editData?.amount));
  const [ownerAmount, setOwnerAmount] = useState<number>(num(editData?.owner_amount));
  const [tenantAmount, setTenantAmount] = useState<number>(num(editData?.tenant_amount));
  const [companyAmount, setCompanyAmount] = useState<number>(num(editData?.company_amount));

  const [selectedPropertyId, setSelectedPropertyId] = useState(editData?.property_id || "");
  const [unitId] = useState(editData?.unit_id || "");
  const [contractId, setContractId] = useState(editData?.contract_id || "");
  const [caseId, setCaseId] = useState(editData?.case_id || "");
  const [taxCategory, setTaxCategory] = useState<TaxCategory>(
    (editData?.tax_category as TaxCategory) || "taxable",
  );
  const [paymentDueDate, setPaymentDueDate] = useState(editData?.payment_due_date || "");
  const [paidAt, setPaidAt] = useState(editData?.paid_at || "");
  const [paidBy, setPaidBy] = useState<PaidBy>((editData?.paid_by as PaidBy) || "company");

  // 按分
  const propertyRow = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
  );
  const [allocate, setAllocate] = useState<boolean>((editData?.allocations?.length ?? 0) > 0);
  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod>(
    (propertyRow?.default_allocation_method as AllocationMethod) || "equal_units",
  );
  const [allocations, setAllocations] = useState<AllocationDraft[]>(
    (editData?.allocations as AllocationDraft[]) ?? [],
  );
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (propertyRow?.default_allocation_method) {
      setAllocationMethod(propertyRow.default_allocation_method as AllocationMethod);
    }
  }, [propertyRow]);

  // 金額入力時、内訳が未入力(全て0)なら自社負担にデフォルトで全額を入れる。
  // 既に内訳が入っている場合はユーザーの手入力を尊重して触らない。
  useEffect(() => {
    if (amount > 0 && ownerAmount === 0 && tenantAmount === 0 && companyAmount === 0) {
      setCompanyAmount(amount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const sumBreakdown = ownerAmount + tenantAmount + companyAmount;
  const breakdownOk = sumBreakdown === amount;

  const formRef = useRef<HTMLFormElement>(null);
  // 編集対象が切り替わった時のみフォーム状態をリセットする。
  // 同じ対象の閉じ直しでは入力を保持して、誤クローズで内容を失わないようにする。
  const lastTargetRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const target = editData?.id ?? "__new__";
    if (lastTargetRef.current === target) return;
    lastTargetRef.current = target;

    setAmount(num(editData?.amount));
    setOwnerAmount(num(editData?.owner_amount));
    setTenantAmount(num(editData?.tenant_amount));
    setCompanyAmount(num(editData?.company_amount));
    setSelectedPropertyId(editData?.property_id || "");
    setContractId(editData?.contract_id || "");
    setCaseId(editData?.case_id || "");
    setTaxCategory((editData?.tax_category as TaxCategory) || "taxable");
    setPaymentDueDate(editData?.payment_due_date || "");
    setPaidAt(editData?.paid_at || "");
    setPaidBy((editData?.paid_by as PaidBy) || "company");
    setAllocate((editData?.allocations?.length ?? 0) > 0);
    setAllocations((editData?.allocations as AllocationDraft[]) ?? []);
    setErrors({});
    setApiError("");
    formRef.current?.reset();
  }, [isOpen, editData]);

  const isEdit = !!editData;

  const filteredContracts = unitId
    ? contracts.filter((c) => c.unit_id === unitId)
    : contracts;

  const filteredCases = selectedPropertyId
    ? cases.filter((c) => !c.property_id || c.property_id === selectedPropertyId)
    : cases;

  const selectedOwner = (() => {
    if (!propertyRow?.owner_id) return null;
    return owners.find((o) => o.id === propertyRow.owner_id) ?? null;
  })();

  async function runAllocationPreview() {
    if (!selectedPropertyId || amount <= 0) return;
    setPreviewing(true);
    try {
      const res = await fetch("/api/expenses/preview-allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: selectedPropertyId,
          amount,
          owner_amount: ownerAmount,
          tenant_amount: tenantAmount,
          company_amount: companyAmount,
          method: allocationMethod,
        }),
      });
      if (!res.ok) return;
      const json = await res.json();
      const drafts: AllocationDraft[] = (json.allocations ?? []).map((a: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        unit_id: a.unit_id,
        owner_id: null,
        owner_amount: a.owner_amount,
        tenant_amount: a.tenant_amount,
        company_amount: a.company_amount,
        amount: a.amount,
        share_ratio: a.share_ratio,
        allocation_method: a.allocation_method,
        unit_number: a.unit_number,
      }));
      setAllocations(drafts);
    } finally {
      setPreviewing(false);
    }
  }

  function updateAllocRow(idx: number, patch: Partial<AllocationDraft>) {
    setAllocations((rows) =>
      rows.map((r, i) => {
        if (i !== idx) return r;
        const merged = { ...r, ...patch };
        merged.amount =
          num(merged.owner_amount) + num(merged.tenant_amount) + num(merged.company_amount);
        return merged;
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setApiError("");

    if (!breakdownOk) {
      setApiError("オーナー/入居者/自社の合計が金額と一致していません");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    formData.forEach((value, key) => {
      data[key] = value;
    });
    data.amount = amount;
    data.owner_amount = ownerAmount;
    data.tenant_amount = tenantAmount;
    data.company_amount = companyAmount;
    data.owner_id = selectedOwner?.id || "";
    data.property_id = selectedPropertyId;
    data.unit_id = unitId;
    data.contract_id = contractId;
    data.case_id = caseId;
    data.tax_category = taxCategory;
    data.paid_by = paidBy;
    data.payment_due_date = paymentDueDate;
    data.paid_at = paidAt;
    data.status = editData?.status || "draft";
    if (allocate && allocations.length > 0) {
      data.allocations = allocations.map((a) => ({
        unit_id: a.unit_id,
        owner_id: a.owner_id,
        owner_amount: a.owner_amount,
        tenant_amount: a.tenant_amount,
        company_amount: a.company_amount,
        amount: a.amount,
        share_ratio: a.share_ratio,
        allocation_method: a.allocation_method,
        notes: a.notes ?? null,
      }));
    }

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
        if (err.details) {
          setErrors(err.details as Record<string, string[]>);
          setApiError("入力内容を確認してください");
        } else {
          setApiError(err.error || "エラーが発生しました");
        }
        return;
      }

      lastTargetRef.current = null;
      formRef.current?.reset();
      onClose();
      router.refresh();
      dispatchAuditLogRefresh();
    } catch (err) {
      const zodErr = err as ZodError;
      if (zodErr.flatten) {
        const fieldErrors = zodErr.flatten().fieldErrors as Record<string, string[]>;
        setErrors(fieldErrors);
        // 入居者負担ありで契約未選択など、クライアント側バリデーション失敗時にも
        // 上部にメッセージを出す(無言で何も起きないと「押せない」ように見えるため)
        const firstMsg =
          fieldErrors.contract_id?.[0] ||
          Object.values(fieldErrors).find((m) => m?.length)?.[0];
        setApiError(firstMsg || "入力内容を確認してください");
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
            {isEdit ? "費用を編集" : "費用を登録"}
          </h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {apiError && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
            {apiError}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* カテゴリ・日付 */}
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
              {errors.expense_date && (
                <p className="text-danger text-sm mt-1">{errors.expense_date[0]}</p>
              )}
            </div>
          </div>

          {/* 内容 */}
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
            {errors.description && (
              <p className="text-danger text-sm mt-1">{errors.description[0]}</p>
            )}
          </div>

          {/* 金額 */}
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              金額 <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="input"
              placeholder="例: 50000"
            />
            {errors.amount && <p className="text-danger text-sm mt-1">{errors.amount[0]}</p>}
          </div>

          <SplitModeSection
            amount={amount}
            ownerAmount={ownerAmount}
            setOwnerAmount={setOwnerAmount}
            tenantAmount={tenantAmount}
            setTenantAmount={setTenantAmount}
            companyAmount={companyAmount}
            setCompanyAmount={setCompanyAmount}
            breakdownOk={breakdownOk}
            sumBreakdown={sumBreakdown}
          />

          {/* 一次支払者（最初に誰が業者へ払うか）。負担区分=最終負担とは別軸 */}
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">支払い方法</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value as PaidBy)}
              className="input"
            >
              {PAID_BY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PAID_BY_LABELS[p]}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-ink-3 mt-1">
              {paidBy === "owner_direct"
                ? "オーナーが業者へ直接支払うため、この費用はオーナー送金から差し引きません（記録のみ）。"
                : "管理会社が業者へ支払います。オーナー負担分は送金から相殺し、不足分はオーナーへ請求します。"}
            </p>
          </div>

          {/* 物件・オーナー */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">物件</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="input"
              >
                <option value="">未指定</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
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
            </div>
          </div>

          {/* ③ 入居者負担があるときの契約セレクタ（敷金充当先を特定） */}
          {tenantAmount > 0 && (
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                敷金から充当する契約 <span className="text-danger">*</span>
              </label>
              {filteredContracts.length === 0 ? (
                <div className="bg-warn-tint text-warn text-sm rounded-lg px-3 py-2">
                  この{unitId ? "部屋" : "物件"}には選べる契約がないため、入居者負担を敷金から充当できません。
                  入居者負担を0にするか、先に契約を登録してください。
                </div>
              ) : (
                <>
                  <select
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    className="input"
                  >
                    <option value="">選択してください</option>
                    {filteredContracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                        {c.deposit ? `（敷金 ¥${Number(c.deposit).toLocaleString()}）` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.contract_id ? (
                    <p className="text-danger text-sm mt-1">{errors.contract_id[0]}</p>
                  ) : (
                    <p className="text-[11px] text-ink-3 mt-1">
                      保存すると、入居者負担分がこの契約の敷金から自動で充当されます。
                    </p>
                  )}
                </>
              )}
            </div>
          )}


          {selectedPropertyId && (
            <AllocationSection
              allocate={allocate}
              setAllocate={setAllocate}
              allocationMethod={allocationMethod}
              setAllocationMethod={setAllocationMethod}
              allocations={allocations}
              updateAllocRow={updateAllocRow}
              previewing={previewing}
              runAllocationPreview={runAllocationPreview}
              amount={amount}
            />
          )}

          {/* 対応案件紐付け */}
          {filteredCases.length > 0 && (
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                紐付ける対応案件
              </label>
              <select
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="input"
              >
                <option value="">未指定</option>
                {filteredCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 支払先 */}
          {payees.length > 0 && (
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">支払先</label>
              <select name="payee_id" defaultValue={editData?.payee_id || ""} className="input">
                <option value="">未指定</option>
                {payees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <MetaFields
            taxCategory={taxCategory}
            setTaxCategory={setTaxCategory}
            paymentDueDate={paymentDueDate}
            setPaymentDueDate={setPaymentDueDate}
            paidAt={paidAt}
            setPaidAt={setPaidAt}
          />

          {/* 備考 */}
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
            <button
              type="submit"
              disabled={loading || !breakdownOk}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "保存中..." : isEdit ? "更新する" : "登録する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
