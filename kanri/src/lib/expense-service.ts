import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { ExpenseFormData } from "@/lib/schemas-expense";

type Client = SupabaseClient<Database>;

export const IMMUTABLE_EXPENSE_STATUSES = ["approved", "ordered", "completed", "paid"] as const;

type SaveResult =
  | { expense: Record<string, unknown> }
  | { error: string; status: number };

type SaveParams = {
  id?: string;
  input: ExpenseFormData;
  company_id: string;
  user_id: string | null;
};

/**
 * 経費を作成または更新する。
 * - しきい値超過 (amount >= companies.expense_approval_threshold) かつ owner_amount > 0 で
 *   status が指定なしまたは draft の場合、pending_approval に自動遷移する
 * - allocations が渡されたら expense_allocations を入れ替え
 * - tenant_amount > 0 の場合 deposit_transactions に charge 行を入れ替え
 */
export async function saveExpense(supabase: Client, params: SaveParams): Promise<SaveResult> {
  const { id, input, company_id, user_id } = params;

  // しきい値判定。threshold が NULL の会社は稟議機能OFF扱い
  let threshold: number | null = null;
  try {
    const { data: company } = await supabase
      .from("companies")
      .select("expense_approval_threshold")
      .eq("id", company_id)
      .single();
    if (company?.expense_approval_threshold != null) {
      threshold = Number(company.expense_approval_threshold);
    }
  } catch {
    // フォールバック値で続行
  }

  const approvalEnabled = threshold !== null;
  const requiresApproval =
    approvalEnabled && input.owner_amount > 0 && input.amount >= threshold!;
  // 稟議OFFの会社では「下書き」概念を使わず、登録した瞬間に approved 扱い
  let targetStatus = input.status;
  if (input.status === "draft") {
    if (!approvalEnabled) targetStatus = "approved";
    else if (requiresApproval) targetStatus = "pending_approval";
  }

  const now = new Date().toISOString();
  const baseRecord: Record<string, unknown> = {
    company_id,
    property_id: input.property_id || null,
    unit_id: input.unit_id || null,
    owner_id: input.owner_id || null,
    payee_id: input.payee_id || null,
    contract_id: input.contract_id || null,
    case_id: input.case_id || null,
    category: input.category,
    description: input.description,
    amount: input.amount,
    owner_amount: input.owner_amount,
    tenant_amount: input.tenant_amount,
    company_amount: input.company_amount,
    expense_date: input.expense_date,
    status: targetStatus,
    paid_by: input.paid_by,
    tax_category: input.tax_category,
    payment_due_date: input.payment_due_date || null,
    paid_at: input.paid_at || null,
    notes: input.notes ?? null,
  };

  // submitted_by/at は pending_approval に遷移する瞬間にだけ書く（新規 or 提出時）
  if (targetStatus === "pending_approval") {
    baseRecord.submitted_by = user_id;
    baseRecord.submitted_at = now;
  }
  // 稟議OFFで即approvedになる場合、承認者は登録者本人
  if (targetStatus === "approved" && input.status === "draft") {
    baseRecord.approved_by = user_id;
    baseRecord.approved_at = now;
  }

  let expenseRow: Record<string, unknown> | null = null;

  if (id) {
    const { data, error } = await supabase
      .from("expenses")
      .update(baseRecord as never)
      .eq("id", id)
      .eq("company_id", company_id)
      .select()
      .single();
    if (error) return { error: "費用の更新に失敗しました", status: 500 };
    expenseRow = data as Record<string, unknown>;

    // 既存 allocations / deposit_transactions（charge for this expense）を一旦削除して再投入
    await supabase.from("expense_allocations").delete().eq("expense_id", id);
    await supabase
      .from("deposit_transactions")
      .delete()
      .eq("expense_id", id)
      .eq("transaction_type", "charge");
  } else {
    const { data, error } = await supabase
      .from("expenses")
      .insert(baseRecord as never)
      .select()
      .single();
    if (error) return { error: "費用の登録に失敗しました", status: 500 };
    expenseRow = data as Record<string, unknown>;
  }

  const expenseId = expenseRow.id as string;

  // 按分明細
  if (input.allocations && input.allocations.length > 0) {
    const rows = input.allocations.map((a) => ({
      company_id,
      expense_id: expenseId,
      unit_id: a.unit_id || null,
      owner_id: a.owner_id || null,
      owner_amount: a.owner_amount,
      tenant_amount: a.tenant_amount,
      company_amount: a.company_amount,
      amount: a.amount,
      share_ratio: a.share_ratio ?? null,
      allocation_method: a.allocation_method,
      notes: a.notes ?? null,
    }));
    const { error: allocErr } = await supabase.from("expense_allocations").insert(rows);
    if (allocErr) {
      if (!id) await supabase.from("expenses").delete().eq("id", expenseId);
      return { error: "按分明細の保存に失敗しました", status: 500 };
    }
  }

  // 入居者負担 → deposit_transactions に charge を登録
  if (input.tenant_amount > 0 && input.contract_id) {
    const { error: depErr } = await supabase.from("deposit_transactions").insert({
      company_id,
      contract_id: input.contract_id,
      expense_id: expenseId,
      amount: input.tenant_amount,
      transaction_type: "charge",
      reason: "restoration",
      occurred_at: input.expense_date,
      notes: input.description,
      created_by: user_id,
    });
    if (depErr) {
      // 経費自体は残し、警告にとどめる（呼び出し側で残高再計算しない）
      // 必要ならここで詳細ログ
    }
  }

  return { expense: expenseRow };
}
