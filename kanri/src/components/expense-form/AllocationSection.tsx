"use client";

import {
  ALLOCATION_METHODS,
  ALLOCATION_METHOD_LABELS,
  type AllocationMethod,
  type ExpenseAllocationInput,
} from "@/lib/schemas-expense";

export type AllocationDraft = ExpenseAllocationInput & {
  unit_number?: string | null;
};

export default function AllocationSection({
  allocate,
  setAllocate,
  allocationMethod,
  setAllocationMethod,
  allocations,
  updateAllocRow,
  previewing,
  runAllocationPreview,
  amount,
}: {
  allocate: boolean;
  setAllocate: (v: boolean) => void;
  allocationMethod: AllocationMethod;
  setAllocationMethod: (m: AllocationMethod) => void;
  allocations: AllocationDraft[];
  updateAllocRow: (idx: number, patch: Partial<AllocationDraft>) => void;
  previewing: boolean;
  runAllocationPreview: () => void;
  amount: number;
}) {
  return (
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
  );
}
