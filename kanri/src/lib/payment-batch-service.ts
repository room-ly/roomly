// 振込バッチ（payment_batches）の候補取得・作成・実行確定ロジック。
// オーナー送金と業者への費用支払いを混在で1バッチにまとめる。
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { APPROVED_EXPENSE_STATUSES } from "@/lib/remittance-data";

type Client = SupabaseClient<Database>;

export interface BatchCandidateRemittance {
  id: string;
  owner_name: string;
  remittance_month: string;
  amount: number;
  bank_code: string;
  branch_code: string;
  account_type: string;
  account_number: string;
  account_holder_kana: string;
  has_bank: boolean;
}

export interface BatchCandidateExpense {
  id: string;
  description: string;
  category: string;
  payee_name: string;
  expense_date: string;
  amount: number;
  bank_code: string;
  branch_code: string;
  account_type: string;
  account_number: string;
  account_holder_kana: string;
  has_bank: boolean;
}

// 既に draft バッチに入っている owner_remittance_id / expense_id を集める（二重計上防止）。
async function getBatchedIds(supabase: Client, company_id: string) {
  const { data } = await supabase
    .from("payment_batch_items")
    .select("owner_remittance_id, expense_id, batch:payment_batches!inner(status)")
    .eq("company_id", company_id);
  const remittanceIds = new Set<string>();
  const expenseIds = new Set<string>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const batch = row.batch as { status?: string } | null;
    // executed バッチも「もう振り込んだ」ので候補から外す（重複防止）。
    if (row.owner_remittance_id) remittanceIds.add(row.owner_remittance_id as string);
    if (row.expense_id) expenseIds.add(row.expense_id as string);
    void batch;
  }
  return { remittanceIds, expenseIds };
}

// バッチに入れられる振込候補を取得する。
// - オーナー送金: status='confirmed'（確定済みでまだ送金していない）かつ未バッチ
// - 費用: paid_by='company' / paid_at IS NULL / 承認済み / payee あり かつ 未バッチ
export async function getBatchCandidates(supabase: Client, company_id: string) {
  const { remittanceIds, expenseIds } = await getBatchedIds(supabase, company_id);

  const [{ data: remittancesRaw }, { data: expensesRaw }] = await Promise.all([
    supabase
      .from("owner_remittances")
      .select(
        "id, remittance_month, net_amount, owner:owners(name, bank_code, bank_branch_code, bank_account_type, bank_account_number, bank_account_holder)",
      )
      .eq("company_id", company_id)
      .eq("status", "confirmed")
      .order("remittance_month", { ascending: false })
      .limit(200),
    supabase
      .from("expenses")
      .select(
        "id, expense_date, description, amount, category, payee:payees(name, bank_code, branch_code, account_type, account_number, account_holder_kana)",
      )
      .eq("company_id", company_id)
      .not("payee_id", "is", null)
      .eq("paid_by", "company")
      .is("paid_at", null)
      .in("status", APPROVED_EXPENSE_STATUSES)
      .order("expense_date", { ascending: false })
      .limit(200),
  ]);

  const remittances: BatchCandidateRemittance[] = ((remittancesRaw ?? []) as Record<string, unknown>[])
    .filter((r) => !remittanceIds.has(r.id as string))
    .map((r) => {
      const o = (r.owner as Record<string, string | null> | null) ?? {};
      const has_bank = !!(o.bank_code && o.bank_branch_code && o.bank_account_number && o.bank_account_holder);
      return {
        id: r.id as string,
        owner_name: o.name ?? "—",
        remittance_month: (r.remittance_month as string)?.slice(0, 7) ?? "",
        amount: Number(r.net_amount) || 0,
        bank_code: o.bank_code ?? "",
        branch_code: o.bank_branch_code ?? "",
        account_type: o.bank_account_type ?? "ordinary",
        account_number: o.bank_account_number ?? "",
        account_holder_kana: o.bank_account_holder ?? "",
        has_bank,
      };
    });

  const expenses: BatchCandidateExpense[] = ((expensesRaw ?? []) as Record<string, unknown>[])
    .filter((e) => !expenseIds.has(e.id as string))
    .map((e) => {
      const p = (e.payee as Record<string, string | null> | null) ?? {};
      const has_bank = !!(p.bank_code && p.branch_code && p.account_number && p.account_holder_kana);
      return {
        id: e.id as string,
        description: (e.description as string) ?? "",
        category: (e.category as string) ?? "other",
        payee_name: p.name ?? "—",
        expense_date: (e.expense_date as string) ?? "",
        amount: Number(e.amount) || 0,
        bank_code: p.bank_code ?? "",
        branch_code: p.branch_code ?? "",
        account_type: p.account_type ?? "ordinary",
        account_number: p.account_number ?? "",
        account_holder_kana: p.account_holder_kana ?? "",
        has_bank,
      };
    });

  return { remittances, expenses };
}

type CreateBatchParams = {
  company_id: string;
  user_id: string | null;
  batch_date: string;
  sender_account_id: string | null;
  notes?: string | null;
  remittance_ids: string[];
  expense_ids: string[];
};

type CreateResult = { batch: Record<string, unknown> } | { error: string; status: number };

// バッチを作成する。候補から口座情報をスナップショットして items を作る。
// 口座情報が欠けている候補・既にバッチ入りの候補は弾く。
export async function createPaymentBatch(supabase: Client, params: CreateBatchParams): Promise<CreateResult> {
  const { company_id, user_id, batch_date, sender_account_id, notes, remittance_ids, expense_ids } = params;

  if (!batch_date) return { error: "振込日を指定してください", status: 400 };
  if (remittance_ids.length === 0 && expense_ids.length === 0) {
    return { error: "振込対象を1件以上選択してください", status: 400 };
  }

  // 候補を取得（未バッチ・口座ありのものだけが対象）し、選択IDと突き合わせる
  const { remittances, expenses } = await getBatchCandidates(supabase, company_id);
  const remMap = new Map(remittances.map((r) => [r.id, r]));
  const expMap = new Map(expenses.map((e) => [e.id, e]));

  const items: Database["public"]["Tables"]["payment_batch_items"]["Insert"][] = [];
  const skipped: string[] = [];

  for (const id of remittance_ids) {
    const r = remMap.get(id);
    if (!r) { skipped.push(`オーナー送金 ${id}（対象外）`); continue; }
    if (!r.has_bank) { skipped.push(`オーナー送金: ${r.owner_name}（口座情報不足）`); continue; }
    items.push({
      company_id,
      payment_batch_id: "", // 後で埋める
      item_type: "owner_remittance",
      owner_remittance_id: r.id,
      expense_id: null,
      recipient_name: r.owner_name,
      bank_code: r.bank_code,
      branch_code: r.branch_code,
      account_type: r.account_type,
      account_number: r.account_number,
      account_holder_kana: r.account_holder_kana,
      amount: r.amount,
      label: `オーナー送金: ${r.owner_name}（${r.remittance_month}）`,
    });
  }
  for (const id of expense_ids) {
    const e = expMap.get(id);
    if (!e) { skipped.push(`費用 ${id}（対象外）`); continue; }
    if (!e.has_bank) { skipped.push(`費用: ${e.description}（${e.payee_name} の口座情報不足）`); continue; }
    items.push({
      company_id,
      payment_batch_id: "",
      item_type: "expense",
      owner_remittance_id: null,
      expense_id: e.id,
      recipient_name: e.payee_name,
      bank_code: e.bank_code,
      branch_code: e.branch_code,
      account_type: e.account_type,
      account_number: e.account_number,
      account_holder_kana: e.account_holder_kana,
      amount: e.amount,
      label: `費用: ${e.description}`,
    });
  }

  if (items.length === 0) {
    return { error: `バッチに入れられる振込がありません${skipped.length ? "（" + skipped.join("、") + "）" : ""}`, status: 400 };
  }

  const total = items.reduce((s, it) => s + Number(it.amount), 0);

  // バッチ本体を作成
  const { data: batch, error: batchErr } = await supabase
    .from("payment_batches")
    .insert({
      company_id,
      batch_date,
      status: "draft",
      total_amount: total,
      sender_account_id: sender_account_id || null,
      notes: notes ?? null,
      created_by: user_id,
    })
    .select()
    .single();
  if (batchErr || !batch) return { error: "振込バッチの作成に失敗しました", status: 500 };

  const batchId = (batch as { id: string }).id;
  const itemRows = items.map((it) => ({ ...it, payment_batch_id: batchId }));
  const { error: itemErr } = await supabase.from("payment_batch_items").insert(itemRows);
  if (itemErr) {
    await supabase.from("payment_batches").delete().eq("id", batchId);
    return { error: "振込明細の保存に失敗しました", status: 500 };
  }

  return { batch };
}

type ExecuteResult = { ok: true } | { error: string; status: number };

// バッチを「振込実行済み」に確定し、紐づくオーナー送金/費用に支払済みを連動記録する。
// 冪等: 既に sent / paid_at 済みは上書きしない。
export async function executePaymentBatch(supabase: Client, company_id: string, batch_id: string): Promise<ExecuteResult> {
  const { data: batch } = await supabase
    .from("payment_batches")
    .select("id, status, batch_date")
    .eq("id", batch_id)
    .eq("company_id", company_id)
    .single();
  if (!batch) return { error: "振込バッチが見つかりません", status: 404 };
  if (batch.status === "executed") return { ok: true }; // 冪等

  const { data: items } = await supabase
    .from("payment_batch_items")
    .select("item_type, owner_remittance_id, expense_id")
    .eq("payment_batch_id", batch_id)
    .eq("company_id", company_id);

  const remittanceIds = ((items ?? []) as Record<string, unknown>[])
    .filter((i) => i.item_type === "owner_remittance" && i.owner_remittance_id)
    .map((i) => i.owner_remittance_id as string);
  const expenseIds = ((items ?? []) as Record<string, unknown>[])
    .filter((i) => i.item_type === "expense" && i.expense_id)
    .map((i) => i.expense_id as string);

  const batchDate = (batch as { batch_date: string }).batch_date;

  // オーナー送金 → sent / sent_date（confirmed のものだけ前進。lock_sent_remittance は status前進と sent_date を許可）
  if (remittanceIds.length > 0) {
    await supabase
      .from("owner_remittances")
      .update({ status: "sent", sent_date: batchDate })
      .in("id", remittanceIds)
      .eq("company_id", company_id)
      .eq("status", "confirmed");
  }
  // 費用 → paid_at（未払いのものだけ。二重記録防止）
  if (expenseIds.length > 0) {
    await supabase
      .from("expenses")
      .update({ paid_at: batchDate })
      .in("id", expenseIds)
      .eq("company_id", company_id)
      .is("paid_at", null);
  }

  // バッチを executed に
  const { error: upErr } = await supabase
    .from("payment_batches")
    .update({ status: "executed", executed_at: new Date().toISOString() })
    .eq("id", batch_id)
    .eq("company_id", company_id);
  if (upErr) return { error: "振込実行の記録に失敗しました", status: 500 };

  return { ok: true };
}
