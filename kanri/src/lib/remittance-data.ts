// 送金計算に必要なオーナー単位のデータ取得（calc プレビューと送金生成 POST で共用）
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildRemittance,
  type BuildRemittanceResult,
  type RemitDbProperty,
  type RemitDbBilling,
  type RemitDbExpense,
} from "./remittance-calc";

const APPROVED_EXPENSE_STATUSES = ["approved", "ordered", "completed", "paid"];

// 承認済み経費とみなすステータス（送金で精算対象にする）
export { APPROVED_EXPENSE_STATUSES };

export interface GatherResult extends BuildRemittanceResult {
  ownerName: string;
}

// オーナー・対象月の送金計算に必要なデータを集めて buildRemittance を実行する。
// manualNetAmount が渡されたら手動上書きとして扱う。
export async function gatherAndBuildRemittance(
  supabase: SupabaseClient,
  params: {
    ownerId: string;
    month: string; // YYYY-MM-01
    manualNetAmount?: number | null;
  }
): Promise<{ ok: false; status: number; error: string } | { ok: true; data: GatherResult; raw: { properties: RemitDbProperty[]; billings: RemitDbBilling[]; expenses: RemitDbExpense[] } }> {
  const { ownerId, month, manualNetAmount } = params;

  const { data: owner } = await supabase
    .from("owners")
    .select("id, name, company_id")
    .eq("id", ownerId)
    .single();
  if (!owner) return { ok: false, status: 404, error: "オーナーが見つかりません" };

  // 会社の課税事業者設定（手数料の消費税用）
  const { data: company } = await supabase
    .from("companies")
    .select("is_tax_invoice_issuer, management_fee_tax_rate")
    .eq("id", (owner as { company_id?: string }).company_id ?? "")
    .maybeSingle();

  const { data: propsRaw } = await supabase
    .from("properties")
    .select("id, name, management_fee_type, management_fee_rate, management_fee_amount, management_form, units(id, unit_number)")
    .eq("owner_id", ownerId);

  const properties: RemitDbProperty[] = ((propsRaw ?? []) as Record<string, unknown>[]).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    management_fee_type: (p.management_fee_type as string) ?? null,
    management_fee_rate: (p.management_fee_rate as number) ?? null,
    management_fee_amount: (p.management_fee_amount as number) ?? null,
    management_form: (p.management_form as string) ?? null,
    units: ((p.units as Record<string, unknown>[]) ?? []).map((u) => ({
      id: u.id as string,
      unit_number: (u.unit_number as string) ?? "",
    })),
  }));

  // 当月の家賃請求 + 各請求への実入金額（partial 対応）
  const { data: billingsRaw } = await supabase
    .from("rent_billings")
    .select("id, contract:contracts(unit_id), payments:rent_payments(amount)")
    .eq("billing_month", month);

  const billings: RemitDbBilling[] = ((billingsRaw ?? []) as Record<string, unknown>[]).map((b) => {
    const contract = b.contract as { unit_id?: string } | null;
    const payments = (b.payments as { amount: number }[] | null) ?? [];
    const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    return {
      id: b.id as string,
      unit_id: contract?.unit_id ?? null,
      paid_amount: paid,
    };
  });

  // 未精算（remittance_id IS NULL）の承認済みオーナー負担経費。
  // paid_by='owner_direct'（オーナーが業者へ直接払った費用）は管理会社のキャッシュが
  // 動いておらず回収不要なので、送金から差し引いてはいけない（二重取り防止）。集約段階で除外する。
  const { data: expensesRaw } = await supabase
    .from("expenses")
    .select("id, description, owner_amount, property_id, unit_id, status, remittance_id")
    .eq("owner_id", ownerId)
    .is("remittance_id", null)
    .gt("owner_amount", 0)
    .neq("paid_by", "owner_direct")
    .in("status", APPROVED_EXPENSE_STATUSES);

  const expenses: RemitDbExpense[] = ((expensesRaw ?? []) as Record<string, unknown>[]).map((e) => ({
    id: e.id as string,
    description: (e.description as string) ?? "経費",
    owner_amount: Number(e.owner_amount || 0),
    property_id: (e.property_id as string) ?? null,
    unit_id: (e.unit_id as string) ?? null,
  }));

  const result = buildRemittance({
    properties,
    billings,
    expenses,
    isTaxInvoiceIssuer: (company as { is_tax_invoice_issuer?: boolean })?.is_tax_invoice_issuer ?? false,
    taxRate: (company as { management_fee_tax_rate?: number })?.management_fee_tax_rate ?? 0.1,
    manualNetAmount,
  });

  return {
    ok: true,
    data: { ...result, ownerName: (owner as { name: string }).name },
    raw: { properties, billings, expenses },
  };
}
