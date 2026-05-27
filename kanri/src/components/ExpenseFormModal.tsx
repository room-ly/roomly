"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  expenseSchema,
  ALLOCATION_METHODS,
  ALLOCATION_METHOD_LABELS,
  TAX_CATEGORIES,
  TAX_CATEGORY_LABELS,
  type AllocationMethod,
  type TaxCategory,
  type ExpenseAllocationInput,
} from "@/lib/schemas-expense";
import type { ZodError } from "zod";

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

export type MaintenanceOption = {
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

type SplitMode = "owner" | "company" | "tenant" | "custom";

type AllocationDraft = ExpenseAllocationInput & {
  unit_number?: string | null;
};

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: SelectOption[];
  owners: SelectOption[];
  payees?: PayeeOption[];
  maintenance?: MaintenanceOption[];
  contracts?: ContractOption[];
  editData?: Record<string, any> | null;
}

const num = (v: unknown) => Number(v ?? 0) || 0;

export default function ExpenseFormModal({
  isOpen,
  onClose,
  properties,
  owners,
  payees = [],
  maintenance = [],
  contracts = [],
  editData,
}: ExpenseFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");

  const initialSplit: SplitMode = (() => {
    if (!editData) return "company";
    if (num(editData.tenant_amount) > 0 && !num(editData.owner_amount) && !num(editData.company_amount))
      return "tenant";
    if (num(editData.owner_amount) > 0 && !num(editData.tenant_amount) && !num(editData.company_amount))
      return "owner";
    if (num(editData.company_amount) > 0 && !num(editData.owner_amount) && !num(editData.tenant_amount))
      return "company";
    return "custom";
  })();

  const [splitMode, setSplitMode] = useState<SplitMode>(initialSplit);
  const [amount, setAmount] = useState<number>(num(editData?.amount));
  const [ownerAmount, setOwnerAmount] = useState<number>(num(editData?.owner_amount));
  const [tenantAmount, setTenantAmount] = useState<number>(num(editData?.tenant_amount));
  const [companyAmount, setCompanyAmount] = useState<number>(num(editData?.company_amount));

  const [selectedPropertyId, setSelectedPropertyId] = useState(editData?.property_id || "");
  const [unitId, setUnitId] = useState(editData?.unit_id || "");
  const [contractId, setContractId] = useState(editData?.contract_id || "");
  const [maintenanceId, setMaintenanceId] = useState(editData?.maintenance_request_id || "");
  const [taxCategory, setTaxCategory] = useState<TaxCategory>(
    (editData?.tax_category as TaxCategory) || "taxable",
  );
  const [paymentDueDate, setPaymentDueDate] = useState(editData?.payment_due_date || "");
  const [paidAt, setPaidAt] = useState(editData?.paid_at || "");

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

  // splitMode 変更で内訳を再計算
  useEffect(() => {
    if (splitMode === "owner") {
      setOwnerAmount(amount);
      setTenantAmount(0);
      setCompanyAmount(0);
    } else if (splitMode === "tenant") {
      setOwnerAmount(0);
      setTenantAmount(amount);
      setCompanyAmount(0);
    } else if (splitMode === "company") {
      setOwnerAmount(0);
      setTenantAmount(0);
      setCompanyAmount(amount);
    }
    // custom は手動入力に任せる
  }, [splitMode, amount]);

  const sumBreakdown = ownerAmount + tenantAmount + companyAmount;
  const breakdownOk = sumBreakdown === amount;

  if (!isOpen) return null;
  const isEdit = !!editData;

  const filteredContracts = unitId
    ? contracts.filter((c) => c.unit_id === unitId)
    : contracts;

  const filteredMaintenance = selectedPropertyId
    ? maintenance.filter((m) => !m.property_id || m.property_id === selectedPropertyId)
    : maintenance;

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
      const drafts: AllocationDraft[] = (json.allocations ?? []).map((a: any) => ({
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
        merged.amount = num(merged.owner_amount) + num(merged.tenant_amount) + num(merged.company_amount);
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
    const data: Record<string, any> = {};
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
    data.maintenance_request_id = maintenanceId;
    data.tax_category = taxCategory;
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
            {isEdit ? "経費を編集" : "経費を登録"}
          </h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {apiError && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">{apiError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              {errors.expense_date && <p className="text-danger text-sm mt-1">{errors.expense_date[0]}</p>}
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
            {errors.description && <p className="text-danger text-sm mt-1">{errors.description[0]}</p>}
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

          {/* 負担区分（3分割） */}
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1.5">負担区分</label>
            <div className="flex rounded-lg border border-line overflow-hidden mb-2">
              {(["company", "owner", "tenant", "custom"] as SplitMode[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setSplitMode(m)}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    splitMode === m ? "bg-accent text-white" : "bg-surface text-ink-3 hover:bg-bg-2"
                  }`}
                >
                  {m === "company" ? "100%自社" : m === "owner" ? "100%オーナー" : m === "tenant" ? "100%入居者" : "カスタム"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-ink-3 block mb-1">オーナー負担</label>
                <input
                  type="number"
                  value={ownerAmount || 0}
                  disabled={splitMode !== "custom"}
                  onChange={(e) => setOwnerAmount(Number(e.target.value) || 0)}
                  className="input"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-3 block mb-1">入居者負担</label>
                <input
                  type="number"
                  value={tenantAmount || 0}
                  disabled={splitMode !== "custom"}
                  onChange={(e) => setTenantAmount(Number(e.target.value) || 0)}
                  className="input"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-3 block mb-1">自社負担</label>
                <input
                  type="number"
                  value={companyAmount || 0}
                  disabled={splitMode !== "custom"}
                  onChange={(e) => setCompanyAmount(Number(e.target.value) || 0)}
                  className="input"
                />
              </div>
            </div>
            <p
              className={`text-[11px] mt-1 ${breakdownOk ? "text-ink-3" : "text-danger"}`}
            >
              内訳合計: ¥{sumBreakdown.toLocaleString()} / 金額: ¥{amount.toLocaleString()}
              {!breakdownOk && " — 一致しません"}
            </p>
          </div>

          {/* 物件・部屋 */}
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

          {/* 入居者負担時の契約セレクタ */}
          {tenantAmount > 0 && (
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">
                契約 <span className="text-danger">*</span>
              </label>
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
              <p className="text-[11px] text-ink-3 mt-1">
                入居者負担分は敷金から自動的に相殺されます
              </p>
            </div>
          )}

          {/* 共用部按分 */}
          {selectedPropertyId && (
            <div className="border border-line rounded-lg p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-ink-2">
                <input
                  type="checkbox"
                  checked={allocate}
                  onChange={(e) => setAllocate(e.target.checked)}
                />
                共用部経費として部屋に按分
              </label>
              {allocate && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={allocationMethod}
                      onChange={(e) => setAllocationMethod(e.target.value as AllocationMethod)}
                      className="input"
                      style={{ maxWidth: 200 }}
                    >
                      {ALLOCATION_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {ALLOCATION_METHOD_LABELS[m]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={previewing || amount <= 0}
                      onClick={runAllocationPreview}
                    >
                      {previewing ? "計算中..." : "按分プレビュー"}
                    </button>
                  </div>
                  {allocations.length > 0 && (
                    <table className="tbl" style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>部屋</th>
                          <th style={{ textAlign: "right" }}>オーナー</th>
                          <th style={{ textAlign: "right" }}>入居者</th>
                          <th style={{ textAlign: "right" }}>自社</th>
                          <th style={{ textAlign: "right" }}>合計</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocations.map((a, i) => (
                          <tr key={a.unit_id || i}>
                            <td>{a.unit_number || "—"}</td>
                            <td>
                              <input
                                type="number"
                                value={a.owner_amount}
                                onChange={(e) =>
                                  updateAllocRow(i, { owner_amount: Number(e.target.value) || 0 })
                                }
                                className="input"
                                style={{ width: 90, textAlign: "right" }}
                                disabled={allocationMethod !== "custom"}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={a.tenant_amount}
                                onChange={(e) =>
                                  updateAllocRow(i, { tenant_amount: Number(e.target.value) || 0 })
                                }
                                className="input"
                                style={{ width: 90, textAlign: "right" }}
                                disabled={allocationMethod !== "custom"}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={a.company_amount}
                                onChange={(e) =>
                                  updateAllocRow(i, { company_amount: Number(e.target.value) || 0 })
                                }
                                className="input"
                                style={{ width: 90, textAlign: "right" }}
                                disabled={allocationMethod !== "custom"}
                              />
                            </td>
                            <td className="num">¥{a.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 修繕紐付け */}
          {filteredMaintenance.length > 0 && (
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">紐付ける修繕依頼</label>
              <select
                value={maintenanceId}
                onChange={(e) => setMaintenanceId(e.target.value)}
                className="input"
              >
                <option value="">未指定</option>
                {filteredMaintenance.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
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

          {/* 税区分・支払期日・支払日 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">税区分</label>
              <select
                value={taxCategory}
                onChange={(e) => setTaxCategory(e.target.value as TaxCategory)}
                className="input"
              >
                {TAX_CATEGORIES.map((t) => (
                  <option key={t} value={t}>
                    {TAX_CATEGORY_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">支払期日</label>
              <input
                type="date"
                value={paymentDueDate || ""}
                onChange={(e) => setPaymentDueDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-2 block mb-1">支払日</label>
              <input
                type="date"
                value={paidAt || ""}
                onChange={(e) => setPaidAt(e.target.value)}
                className="input"
              />
            </div>
          </div>

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
            <button type="submit" disabled={loading || !breakdownOk} className="btn btn-primary disabled:opacity-50">
              {loading ? "保存中..." : isEdit ? "更新する" : "登録する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
