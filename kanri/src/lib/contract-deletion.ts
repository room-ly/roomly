// 契約・入居者・請求の削除ロジックを集約する。
//
// 背景（再発防止）:
//   contracts / rent_billings / rent_payments は FK の ON DELETE RESTRICT で繋がっており、
//   入金履歴が1件でもあると請求も契約も入居者も物理削除できないデッドロックが起きていた。
//
// 方針:
//   - 入金履歴（rent_payments）が無い「作りかけ」データ → 子から順に物理カスケード削除
//   - 入金履歴が1件でもある「使われた」データ → 論理削除（voided_at を立てる）
//     お金が動いた記録は会計・監査上、消した事実ごと残す。
//
// 実装は通常の Supabase クライアント（呼び出し元のユーザーJWT＋RLS）で行う。
//   - RLS は自社(company_id)の行の削除/更新を許可しているので service_role は不要
//   - 監査ログの操作者は auth.uid() から自動で入る（Management API 経由だと NULL になる罠を回避）
//   - 以前は runManagementSql を使っていたが、SUPABASE_ACCESS_TOKEN がローカルに無く 500 になる、
//     PostgREST を通らず重い等の問題があったため通常クライアントに変更（2026-06-14）

import type { SupabaseClient } from "@supabase/supabase-js";

export interface DeletionPreview {
  billings: number; // 紐づく家賃請求の件数
  payments: number; // 紐づく入金/返金履歴の件数
  mode: "void" | "physical"; // payments>0 → 論理削除 / =0 → 物理削除
}

// 契約ID群に紐づく請求・入金の件数を数える。
export async function previewDeletion(
  supabase: SupabaseClient,
  contractIds: string[],
  companyId: string,
): Promise<DeletionPreview> {
  if (contractIds.length === 0) {
    return { billings: 0, payments: 0, mode: "physical" };
  }

  const { data: billingRows } = await supabase
    .from("rent_billings")
    .select("id")
    .in("contract_id", contractIds)
    .eq("company_id", companyId);

  const billingIds = (billingRows ?? []).map((b) => b.id);
  const billings = billingIds.length;

  let payments = 0;
  if (billingIds.length > 0) {
    const { count } = await supabase
      .from("rent_payments")
      .select("id", { count: "exact", head: true })
      .in("billing_id", billingIds);
    payments = count ?? 0;
  }

  return { billings, payments, mode: payments > 0 ? "void" : "physical" };
}

// 契約（複数可）とその子を削除する。tenantId を渡すと入居者も同じ方式で処理する。
// payments があれば論理削除（voided_at）、無ければ子→親の物理カスケード。
export async function deleteContractsCascade(params: {
  supabase: SupabaseClient;
  contractIds: string[];
  tenantId?: string;
  companyId: string;
}): Promise<{ ok: true; mode: "void" | "physical" } | { ok: false; error: string }> {
  const { supabase, contractIds, tenantId, companyId } = params;
  if (contractIds.length === 0 && !tenantId) {
    return { ok: false, error: "削除対象がありません" };
  }

  const preview = await previewDeletion(supabase, contractIds, companyId);

  if (preview.mode === "void") {
    // 論理削除: 契約・請求に voided_at を立てる。入金履歴は子として残す（履歴保持）。
    const now = new Date().toISOString();
    if (contractIds.length > 0) {
      const { error: be } = await supabase
        .from("rent_billings")
        .update({ voided_at: now })
        .in("contract_id", contractIds)
        .eq("company_id", companyId)
        .is("voided_at", null);
      if (be) return { ok: false, error: be.message };

      const { error: ce } = await supabase
        .from("contracts")
        .update({ voided_at: now })
        .in("id", contractIds)
        .eq("company_id", companyId)
        .is("voided_at", null);
      if (ce) return { ok: false, error: ce.message };
    }
    return { ok: true, mode: "void" };
  }

  // 物理削除: 子 → 親 の順。RESTRICT を回さないと弾かれる。
  if (contractIds.length > 0) {
    const { data: billingRows } = await supabase
      .from("rent_billings")
      .select("id")
      .in("contract_id", contractIds)
      .eq("company_id", companyId);
    const billingIds = (billingRows ?? []).map((b) => b.id);

    if (billingIds.length > 0) {
      const { error } = await supabase.from("rent_payments").delete().in("billing_id", billingIds);
      if (error) return { ok: false, error: error.message };
    }

    const { error: moe } = await supabase
      .from("move_out_requests")
      .delete()
      .in("contract_id", contractIds)
      .eq("company_id", companyId);
    if (moe) return { ok: false, error: moe.message };

    const { error: be } = await supabase
      .from("rent_billings")
      .delete()
      .in("contract_id", contractIds)
      .eq("company_id", companyId);
    if (be) return { ok: false, error: be.message };

    const { error: ce } = await supabase
      .from("contracts")
      .delete()
      .in("id", contractIds)
      .eq("company_id", companyId);
    if (ce) return { ok: false, error: ce.message };
  }

  if (tenantId) {
    const { error: moe } = await supabase
      .from("move_out_requests")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId);
    if (moe) return { ok: false, error: moe.message };

    // 入居者に他の契約が残っていれば削除しない（RESTRICT で弾かれる）
    const { count: remaining } = await supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
    if ((remaining ?? 0) === 0) {
      const { error: te } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenantId)
        .eq("company_id", companyId);
      if (te) return { ok: false, error: te.message };
    }
  }

  return { ok: true, mode: "physical" };
}
