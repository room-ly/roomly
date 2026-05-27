import type { AllocationMethod } from "@/lib/schemas-expense";

export type AllocationUnitInfo = {
  id: string;
  unit_number?: string | null;
  area_sqm?: number | null;
  owner_share?: number | null;
};

export type AllocationDraft = {
  unit_id: string | null;
  owner_id: string | null;
  unit_number: string | null;
  owner_amount: number;
  tenant_amount: number;
  company_amount: number;
  amount: number;
  share_ratio: number;
  allocation_method: AllocationMethod;
};

const round = (n: number) => Math.round(n);

/**
 * 共用部経費を物件配下の各 unit に按分する。
 * 内訳金額（owner/tenant/company）もそれぞれ同じ比率で按分する。
 * 丸め誤差は最終行で吸収して合計を一致させる。
 */
export function buildUnitAllocations(
  units: AllocationUnitInfo[],
  totals: {
    amount: number;
    owner_amount: number;
    tenant_amount: number;
    company_amount: number;
  },
  method: AllocationMethod,
): AllocationDraft[] {
  if (units.length === 0) return [];

  const weights = computeWeights(units, method);
  const sumWeight = weights.reduce((s, w) => s + w, 0) || 1;

  const drafts: AllocationDraft[] = units.map((u, i) => {
    const ratio = weights[i] / sumWeight;
    return {
      unit_id: u.id,
      owner_id: null,
      unit_number: u.unit_number ?? null,
      owner_amount: round(totals.owner_amount * ratio),
      tenant_amount: round(totals.tenant_amount * ratio),
      company_amount: round(totals.company_amount * ratio),
      amount: round(totals.amount * ratio),
      share_ratio: Number(ratio.toFixed(5)),
      allocation_method: method,
    };
  });

  // 丸め誤差を最終行で吸収
  const sums = drafts.reduce(
    (acc, d) => ({
      amount: acc.amount + d.amount,
      owner_amount: acc.owner_amount + d.owner_amount,
      tenant_amount: acc.tenant_amount + d.tenant_amount,
      company_amount: acc.company_amount + d.company_amount,
    }),
    { amount: 0, owner_amount: 0, tenant_amount: 0, company_amount: 0 },
  );
  const last = drafts[drafts.length - 1];
  last.amount += totals.amount - sums.amount;
  last.owner_amount += totals.owner_amount - sums.owner_amount;
  last.tenant_amount += totals.tenant_amount - sums.tenant_amount;
  last.company_amount += totals.company_amount - sums.company_amount;

  // 内訳合計と amount の整合性を最終行で再確認
  last.amount = last.owner_amount + last.tenant_amount + last.company_amount;

  return drafts;
}

function computeWeights(units: AllocationUnitInfo[], method: AllocationMethod): number[] {
  switch (method) {
    case "equal_units":
      return units.map(() => 1);
    case "by_floor_area":
      return units.map((u) => Number(u.area_sqm ?? 0) || 0);
    case "by_owner_share":
      return units.map((u) => Number(u.owner_share ?? 0) || 0);
    case "custom":
    default:
      return units.map(() => 1);
  }
}

/**
 * 内訳合計と amount の整合性を検証する。
 */
export function validateAllocations(
  drafts: Array<{ owner_amount: number; tenant_amount: number; company_amount: number; amount: number }>,
  total: { amount: number; owner_amount: number; tenant_amount: number; company_amount: number },
): { ok: boolean; reason?: string } {
  const sums = drafts.reduce(
    (acc, d) => ({
      amount: acc.amount + d.amount,
      owner_amount: acc.owner_amount + d.owner_amount,
      tenant_amount: acc.tenant_amount + d.tenant_amount,
      company_amount: acc.company_amount + d.company_amount,
    }),
    { amount: 0, owner_amount: 0, tenant_amount: 0, company_amount: 0 },
  );
  if (sums.amount !== total.amount) return { ok: false, reason: "amount 合計不一致" };
  if (sums.owner_amount !== total.owner_amount) return { ok: false, reason: "owner_amount 合計不一致" };
  if (sums.tenant_amount !== total.tenant_amount) return { ok: false, reason: "tenant_amount 合計不一致" };
  if (sums.company_amount !== total.company_amount) return { ok: false, reason: "company_amount 合計不一致" };
  for (const d of drafts) {
    if (d.owner_amount + d.tenant_amount + d.company_amount !== d.amount) {
      return { ok: false, reason: "各行の内訳合計が amount と不一致" };
    }
  }
  return { ok: true };
}
