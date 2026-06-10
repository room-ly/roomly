import { createClient, type Row } from "./_shared";

// 対応案件一覧（物件・部屋付き）— ページネーション対応
export async function getCases(page = 1, pageSize = 50, sort = "reported_date:desc"): Promise<{ data: Row[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const [sortCol, sortDir] = sort.split(":") as [string, string];
  const { data, error, count } = await supabase
    .from("cases")
    .select("*, property:properties(name), unit:units(unit_number)", { count: "exact" })
    .order(sortCol, { ascending: sortDir === "asc" })
    .range(from, to);
  if (error) throw error;
  return { data: (data ?? []) as Row[], total: count ?? 0 };
}

// 対応案件詳細（物件・部屋・対応履歴付き）
export async function getCaseDetail(id: string) {
  const supabase = await createClient();
  const [{ data: caseRow, error }, { data: logs }, { data: expenses }] = await Promise.all([
    supabase.from("cases").select("*, property:properties(id, name, address, owner:owners(id, name, email)), unit:units(unit_number), tenant:tenants(id, name, phone, email)").eq("id", id).single(),
    supabase.from("case_logs").select("*").eq("case_id", id).order("logged_at", { ascending: false }),
    supabase.from("expenses").select("id, description, amount, expense_date, status, category").eq("case_id", id).order("expense_date", { ascending: false }),
  ]);
  if (error || !caseRow) return null;

  return { case: caseRow, logs: logs ?? [], expenses: expenses ?? [] };
}

// 対応案件セレクタ用
export async function getCasesForSelect(propertyId?: string | null) {
  const supabase = await createClient();
  let q = supabase
    .from("cases")
    .select("id, title, status, property_id, unit_id, property:properties(name), unit:units(unit_number)")
    .order("reported_date", { ascending: false })
    .limit(50);
  if (propertyId) q = q.eq("property_id", propertyId);
  const { data } = await q;
  return (data ?? []) as Row[];
}
