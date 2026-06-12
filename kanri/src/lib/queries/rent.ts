import { createClient, type Row } from "./_shared";

// 滞納エイジングレポート（30/60/90+日の滞納額・件数 + 内訳）
// 「滞納」= due_date を過ぎていて、入金合計が請求額に達していない請求。
// status カラムには依存しない（自動更新ジョブが無い前提でも常に正しく出るように）。
export interface AgingItem {
  id: string;
  due_date: string;
  days_overdue: number;
  unpaid_amount: number;
  total_amount: number;
  tenant_name: string | null;
  property_name: string | null;
  unit_number: string | null;
}
export interface AgingBucket {
  count: number;
  amount: number;
  items: AgingItem[];
}
export async function getOverdueAging(): Promise<{
  bucket30: AgingBucket;
  bucket60: AgingBucket;
  bucket90: AgingBucket;
}> {
  const supabase = await createClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("rent_billings")
    .select(
      "id, due_date, total_amount, contract:contracts(tenant:tenants(name), unit:units(unit_number, property:properties(name))), rent_payments(amount)"
    )
    .is("voided_at", null)
    .lt("due_date", todayStr);

  const result: { bucket30: AgingBucket; bucket60: AgingBucket; bucket90: AgingBucket } = {
    bucket30: { count: 0, amount: 0, items: [] },
    bucket60: { count: 0, amount: 0, items: [] },
    bucket90: { count: 0, amount: 0, items: [] },
  };
  for (const row of (data ?? []) as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const total = Number(row.total_amount) || 0;
    const paid = (row.rent_payments ?? []).reduce(
      (s: number, p: any) => s + (Number(p.amount) || 0), // eslint-disable-line @typescript-eslint/no-explicit-any
      0
    );
    const unpaid = total - paid;
    if (unpaid <= 0) continue;

    const due = new Date(row.due_date);
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const item: AgingItem = {
      id: row.id,
      due_date: row.due_date,
      days_overdue: daysOverdue,
      unpaid_amount: unpaid,
      total_amount: total,
      tenant_name: row.contract?.tenant?.name ?? null,
      property_name: row.contract?.unit?.property?.name ?? null,
      unit_number: row.contract?.unit?.unit_number ?? null,
    };

    let bucket: AgingBucket;
    if (daysOverdue > 60) bucket = result.bucket90;
    else if (daysOverdue > 30) bucket = result.bucket60;
    else bucket = result.bucket30;
    bucket.count++;
    bucket.amount += unpaid;
    bucket.items.push(item);
  }
  for (const b of [result.bucket30, result.bucket60, result.bucket90]) {
    b.items.sort((a, b) => b.days_overdue - a.days_overdue);
  }
  return result;
}

// 家賃請求一覧（契約・入居者・物件付き）— ページネーション対応
export async function getRentBillings(
  page = 1,
  pageSize = 50,
  sort = "billing_month:desc",
  billingMonth?: string,
): Promise<{ data: Row[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const [sortCol, sortDir] = sort.split(":") as [string, string];
  let query = supabase
    .from("rent_billings")
    .select(
      "*, contract:contracts(id, tenant:tenants(name, phone), unit:units(unit_number, property:properties(id, name))), rent_payments(payment_date, amount)",
      { count: "exact" }
    )
    .is("voided_at", null);
  if (billingMonth) {
    query = query.eq("billing_month", billingMonth);
  }
  const { data, error, count } = await query
    .order(sortCol, { ascending: sortDir === "asc" })
    .range(from, to);
  if (error) throw error;
  return { data: (data ?? []) as Row[], total: count ?? 0 };
}

// 家賃画面の月セレクト用に、rent_billings に存在する全 billing_month を新しい順で返す
export async function getAvailableBillingMonths(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rent_billings")
    .select("billing_month")
    .is("voided_at", null)
    .order("billing_month", { ascending: false });
  if (error) throw error;
  const set = new Set<string>();
  for (const row of data ?? []) {
    if (row.billing_month) set.add(row.billing_month as string);
  }
  return Array.from(set);
}

// 家賃請求詳細 — 指定IDの請求を起点に、同一契約の全請求を時系列で返す
export async function getRentBillingDetail(id: string) {
  const supabase = await createClient();
  const { data: target, error: targetErr } = await supabase
    .from("rent_billings")
    .select(
      "*, contract:contracts(id, tenant:tenants(id, name, phone, email), unit:units(id, unit_number, property:properties(id, name, address))), rent_payments(id, amount, payment_date, payment_method, notes, created_at)"
    )
    .eq("id", id)
    .single();
  if (targetErr || !target) return null;

  const contractId = target.contract?.id;
  if (!contractId) return { current: target, history: [target] };

  const { data: history, error: histErr } = await supabase
    .from("rent_billings")
    .select(
      "id, billing_month, rent, management_fee, other_amount, other_description, total_amount, due_date, status, rent_payments(id, amount, payment_date, payment_method, notes)"
    )
    .eq("contract_id", contractId)
    .is("voided_at", null)
    .order("billing_month", { ascending: false });

  return {
    current: target,
    history: histErr ? [target] : (history ?? [target]),
  };
}
