import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

type CaseRow = {
  id: string;
  company_id: string;
  property_id?: string | null;
  unit_id?: string | null;
  category?: string | null;
  title?: string | null;
  vendor_name?: string | null;
  estimated_cost?: number | string | null;
  actual_cost?: number | string | null;
  completed_date?: string | null;
  reported_date?: string | null;
};

// 対応案件のカテゴリ → 経費カテゴリへのマッピング
function mapCategory(caseCategory: string | null): "repair" | "cleaning" | "other" {
  switch (caseCategory) {
    case "repair":
    case "key":
    case "common_area":
    case "inspection":
      return "repair";
    default:
      return "other";
  }
}

function toNumber(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * 対応案件の完了をトリガーに、対応する経費を作成または同期する。
 *
 * 仕様:
 * - 既に case_id で紐付いた経費があれば「実費・業者・日付」だけ上書き同期。負担区分や status は触らない（人手で編集された値を尊重）
 * - 紐付き経費がなければ新規作成。金額は actual_cost を優先、なければ estimated_cost。両方とも未確定なら作成しない
 * - 負担区分は全額オーナー負担で初期化。オーナーは property → owner で解決
 */
export async function syncExpenseFromCase(
  supabase: Client,
  caseRow: CaseRow,
): Promise<{ created: boolean; expenseId?: string; skipped?: string }> {
  // 既存の紐付け経費を探す
  const { data: existing } = await supabase
    .from("expenses")
    .select("id, status, amount, owner_amount, tenant_amount, company_amount")
    .eq("case_id", caseRow.id)
    .eq("company_id", caseRow.company_id)
    .maybeSingle();

  // 実費が入っていればそちらを優先、無ければ見積で仮置き
  const amount =
    toNumber(caseRow.actual_cost) ?? toNumber(caseRow.estimated_cost) ?? null;

  // 既存ありの場合: 同期だけ。amount は実費があれば差し替え、ただし内訳合計が崩れるので
  // 比率を保って再配分する
  if (existing) {
    const updates: Record<string, unknown> = {
      description: caseRow.title ?? "対応案件",
      expense_date:
        caseRow.completed_date ??
        caseRow.reported_date ??
        new Date().toISOString().slice(0, 10),
      category: mapCategory(caseRow.category ?? null),
    };

    if (amount != null && Number(existing.amount) !== amount) {
      const prev = Number(existing.amount) || 0;
      if (prev === 0) {
        // 過去の amount が 0 なら全額オーナー負担で再構成
        updates.amount = amount;
        updates.owner_amount = amount;
        updates.tenant_amount = 0;
        updates.company_amount = 0;
      } else {
        // 比率を維持
        const ratio = amount / prev;
        const owner = Math.round(Number(existing.owner_amount) * ratio);
        const tenant = Math.round(Number(existing.tenant_amount) * ratio);
        const company = amount - owner - tenant;
        updates.amount = amount;
        updates.owner_amount = owner;
        updates.tenant_amount = tenant;
        updates.company_amount = company;
      }
    }

    await supabase
      .from("expenses")
      .update(updates as never)
      .eq("id", existing.id)
      .eq("company_id", caseRow.company_id);

    return { created: false, expenseId: existing.id };
  }

  // 新規作成: 金額未確定なら作成しない
  if (amount == null) {
    return { created: false, skipped: "amount_unknown" };
  }

  // オーナー解決
  let ownerId: string | null = null;
  if (caseRow.property_id) {
    const { data: prop } = await supabase
      .from("properties")
      .select("owner_id")
      .eq("id", caseRow.property_id)
      .maybeSingle();
    ownerId = (prop?.owner_id as string | null) ?? null;
  }

  const expenseDate =
    caseRow.completed_date ??
    caseRow.reported_date ??
    new Date().toISOString().slice(0, 10);

  const insertData: Record<string, unknown> = {
    company_id: caseRow.company_id,
    property_id: caseRow.property_id ?? null,
    unit_id: caseRow.unit_id ?? null,
    owner_id: ownerId,
    case_id: caseRow.id,
    category: mapCategory(caseRow.category ?? null),
    description: caseRow.title ?? "対応案件",
    amount,
    owner_amount: amount, // 初期は全額オーナー負担
    tenant_amount: 0,
    company_amount: 0,
    expense_date: expenseDate,
    status: "draft",
    tax_category: "taxable",
  };

  const { data: created, error } = await supabase
    .from("expenses")
    .insert(insertData as never)
    .select("id")
    .single();

  if (error || !created) {
    return { created: false, skipped: "insert_failed" };
  }

  return { created: true, expenseId: created.id };
}
