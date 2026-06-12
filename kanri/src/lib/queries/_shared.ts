import { createClient } from "@/lib/supabase-server";
import type { Database } from "../database.types";

export type Tables = Database["public"]["Tables"];
export type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export { createClient };

// 課金状態を取得し、表示可能な区画IDセットを返す
// 課金中 → null（制限なし）、課金切れで11区画以上 → 古い順10件のIDセット
export async function getVisibleUnitIds(): Promise<Set<string> | null> {
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("subscription_status, subscription_current_period_end, max_units")
    .single();

  const isActive =
    company?.subscription_status === "active" &&
    (!company.subscription_current_period_end ||
      new Date(company.subscription_current_period_end) > new Date());

  if (isActive) return null;

  const freeLimit = 10;

  const { data: allUnits } = await supabase
    .from("units")
    .select("id")
    .order("created_at", { ascending: true });

  const units = allUnits ?? [];
  if (units.length <= freeLimit) return null;

  const visibleIds = new Set(units.slice(0, freeLimit).map((u: Row) => u.id as string));
  return visibleIds;
}

// 入居中の部屋の「実家賃」は契約が正。
// 部屋にネストした contracts からアクティブ契約を探し、その rent/management_fee を採用する。
// アクティブ契約が無い（＝空室）部屋は units.rent を募集賃料としてそのまま使う。
export function activeContractFees(unit: Row): { rent: number; management_fee: number } {
  const active = Array.isArray(unit.contracts)
    ? unit.contracts.find((c: Row) => c.status === "active" && !c.voided_at)
    : null;
  if (active) {
    return {
      rent: Number(active.rent ?? 0),
      management_fee: Number(active.management_fee ?? 0),
    };
  }
  return {
    rent: Number(unit.rent ?? 0),
    management_fee: Number(unit.management_fee ?? 0),
  };
}

// 部屋オブジェクトの rent/management_fee を「実効家賃」（入居中=契約 / 空室=募集賃料）に差し替える。
// 既存の表示コンポーネントは unit.rent をそのまま参照しているので、値だけ正しくして無改修で済ませる。
export function withEffectiveRent(unit: Row): Row {
  const fees = activeContractFees(unit);
  return { ...unit, rent: fees.rent, management_fee: fees.management_fee };
}

// 区画リストにvisibility情報を付与
export function applyUnitVisibility(units: Row[], visibleIds: Set<string> | null): Row[] {
  if (!visibleIds) return units.map((u: Row) => ({ ...u, _hidden: false }));
  return units.map((u: Row) => ({
    ...u,
    _hidden: !visibleIds.has(u.id),
  }));
}
