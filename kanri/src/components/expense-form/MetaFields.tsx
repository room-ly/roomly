"use client";

import {
  TAX_CATEGORIES,
  TAX_CATEGORY_LABELS,
  type TaxCategory,
} from "@/lib/schemas-expense";

export default function MetaFields({
  taxCategory,
  setTaxCategory,
  paymentDueDate,
  setPaymentDueDate,
  paidAt,
  setPaidAt,
}: {
  taxCategory: TaxCategory;
  setTaxCategory: (t: TaxCategory) => void;
  paymentDueDate: string;
  setPaymentDueDate: (v: string) => void;
  paidAt: string;
  setPaidAt: (v: string) => void;
}) {
  return (
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
  );
}
