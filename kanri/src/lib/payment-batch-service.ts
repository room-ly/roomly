// 振込バッチ（payment_batches）の候補取得・作成・実行確定ロジック。
// オーナー送金と業者への費用支払いを混在で1バッチにまとめる。
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { APPROVED_EXPENSE_STATUSES } from "@/lib/remittance-data";
import {
  buildRemittance,
  type RemitDbProperty,
  type RemitDbBilling,
  type RemitDbExpense,
} from "@/lib/remittance-calc";

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
  payee_id: string | null;
  payee_name: string;
  expense_date: string;
  amount: number;
  bank_code: string;
  branch_code: string;
  account_type: string;
  account_number: string;
  account_holder_kana: string;
  has_payee: boolean; // 支払先が設定されているか
  has_bank: boolean;  // 支払先に口座情報まで揃っているか（振込可能か）
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
        "id, remittance_month, net_amount, owner:owners(name, bank_code, bank_branch_code, bank_account_type, bank_account_number, bank_account_holder, bank_account_holder_kana)",
      )
      .eq("company_id", company_id)
      .eq("status", "confirmed")
      .order("remittance_month", { ascending: false })
      .limit(200),
    // 支払先未設定の費用も「振込候補」に出す（その場で支払先を設定できるUIにするため）。
    // payee_id IS NULL を弾かない。company/未払い/承認済みは維持。
    supabase
      .from("expenses")
      .select(
        "id, expense_date, description, amount, category, payee_id, payee:payees(name, bank_code, branch_code, account_type, account_number, account_holder_kana)",
      )
      .eq("company_id", company_id)
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
      // 名義はカナが正（全銀CSVはカナ）。旧データは bank_account_holder に入っているため両対応。
      const holderKana = o.bank_account_holder_kana || o.bank_account_holder;
      const has_bank = !!(o.bank_code && o.bank_branch_code && o.bank_account_number && holderKana);
      return {
        id: r.id as string,
        owner_name: o.name ?? "—",
        remittance_month: (r.remittance_month as string)?.slice(0, 7) ?? "",
        amount: Number(r.net_amount) || 0,
        bank_code: o.bank_code ?? "",
        branch_code: o.bank_branch_code ?? "",
        account_type: o.bank_account_type ?? "ordinary",
        account_number: o.bank_account_number ?? "",
        account_holder_kana: holderKana ?? "",
        has_bank,
      };
    });

  const expenses: BatchCandidateExpense[] = ((expensesRaw ?? []) as Record<string, unknown>[])
    .filter((e) => !expenseIds.has(e.id as string))
    .map((e) => {
      const p = (e.payee as Record<string, string | null> | null) ?? {};
      const has_payee = !!e.payee_id;
      const has_bank = !!(p.bank_code && p.branch_code && p.account_number && p.account_holder_kana);
      return {
        id: e.id as string,
        description: (e.description as string) ?? "",
        category: (e.category as string) ?? "other",
        payee_id: (e.payee_id as string) ?? null,
        payee_name: p.name ?? "",
        expense_date: (e.expense_date as string) ?? "",
        amount: Number(e.amount) || 0,
        bank_code: p.bank_code ?? "",
        branch_code: p.branch_code ?? "",
        account_type: p.account_type ?? "ordinary",
        account_number: p.account_number ?? "",
        account_holder_kana: p.account_holder_kana ?? "",
        has_payee,
        has_bank,
      };
    });

  return { remittances, expenses };
}

export interface UnconfirmedOwnerCandidate {
  owner_id: string;
  owner_name: string;
  remittance_month: string; // YYYY-MM
  preview_net_amount: number;
  existing_remittance_id: string | null; // 既に draft がある場合はその id
  has_bank: boolean;
}

// 対象月の精算進捗サマリー（締め作業の俯瞰用）。
export interface MonthSettlementSummary {
  total_owners: number;       // この月に送金対象（net>0）となるオーナー数
  confirmed_owners: number;   // 確定済み（confirmed/sent）
  unconfirmed_owners: number; // 未確定（未作成 or draft）
  confirmed_amount: number;   // 確定済みオーナーの送金額合計
  unconfirmed_amount: number; // 未確定オーナーの精算予定額合計
  // 候補が0件のときに「なぜ出ないか」を画面で案内するための内訳。
  registered_owners: number;  // 会社に登録されているオーナー総数
  owners_without_net: number; // 送金額が0円以下のため候補外となったオーナー数
  month_paid_total: number;   // 対象月の家賃入金合計（0なら入金未登録）
}

// 振込画面でその場で精算を確定できるよう、対象月にまだ confirmed になっていない
// オーナーを計算プレビュー付きで返す。あわせて対象月全体の精算進捗サマリーも返す。
// - owner_remittance が未作成、または status='draft' のオーナーが候補
// - 既に confirmed/sent のオーナーは getBatchCandidates 側に出るので候補からは除外（サマリーには計上）
export async function getUnconfirmedOwnerCandidates(
  supabase: Client,
  company_id: string,
  month: string, // YYYY-MM-01
): Promise<{ candidates: UnconfirmedOwnerCandidate[]; summary: MonthSettlementSummary }> {
  // 以前はオーナーごとに gatherAndBuildRemittance を直列 await で呼んでおり、
  // 「全オーナー × 1人あたり5クエリ」を逐次実行して非常に遅かった。
  // ここでは精算計算に必要なデータ（会社設定・全物件/部屋・当月請求/入金・未精算経費）を
  // company 単位でまとめて1回ずつ取得し、オーナーごとにメモリ上で割り当てて buildRemittance を呼ぶ。
  // buildRemittance は billings を unit_id キーで突き合わせるため、当月請求を全件渡しても
  // 各オーナーの部屋に属する請求だけが計上され、従来と同一の結果になる。
  const [
    { data: ownersRaw },
    { data: remitsRaw },
    { data: company },
    { data: propsRaw },
    { data: billingsRaw },
    { data: expensesRaw },
  ] = await Promise.all([
    supabase
      .from("owners")
      .select("id, name, bank_code, bank_branch_code, bank_account_type, bank_account_number, bank_account_holder, bank_account_holder_kana")
      .eq("company_id", company_id)
      .order("name"),
    supabase
      .from("owner_remittances")
      .select("id, owner_id, status, net_amount")
      .eq("company_id", company_id)
      .eq("remittance_month", month),
    supabase
      .from("companies")
      .select("is_tax_invoice_issuer, management_fee_tax_rate")
      .eq("id", company_id)
      .maybeSingle(),
    supabase
      .from("properties")
      .select("id, owner_id, name, management_fee_type, management_fee_rate, management_fee_amount, management_form, units(id, unit_number)")
      .eq("company_id", company_id),
    // 当月の家賃請求 + 各請求への実入金（partial 対応）。会社全体で1回だけ取得。
    supabase
      .from("rent_billings")
      .select("id, contract:contracts(unit_id), payments:rent_payments(amount)")
      .is("voided_at", null)
      .eq("billing_month", month),
    // 未精算・承認済み・オーナー負担(>0)・owner_direct 以外の経費。会社全体で1回取得しオーナー別に振り分ける。
    supabase
      .from("expenses")
      .select("id, owner_id, description, owner_amount, property_id, unit_id, status, remittance_id, paid_by")
      .eq("company_id", company_id)
      .is("remittance_id", null)
      .gt("owner_amount", 0)
      .neq("paid_by", "owner_direct")
      .in("status", APPROVED_EXPENSE_STATUSES),
  ]);

  const remitByOwner = new Map<string, { id: string; status: string; net_amount: number }>();
  for (const r of (remitsRaw ?? []) as Record<string, unknown>[]) {
    remitByOwner.set(r.owner_id as string, {
      id: r.id as string,
      status: r.status as string,
      net_amount: Number(r.net_amount) || 0,
    });
  }

  // 当月請求を unit_id 別の実入金額に正規化（gatherAndBuildRemittance と同じ整形）
  const billings: RemitDbBilling[] = ((billingsRaw ?? []) as Record<string, unknown>[]).map((b) => {
    const contract = b.contract as { unit_id?: string } | null;
    const payments = (b.payments as { amount: number }[] | null) ?? [];
    const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    return { id: b.id as string, unit_id: contract?.unit_id ?? null, paid_amount: paid };
  });

  const pushTo = <T>(map: Map<string, T[]>, key: string, value: T) => {
    const arr = map.get(key);
    if (arr) arr.push(value);
    else map.set(key, [value]);
  };

  // 物件をオーナー別にグルーピング
  const propsByOwner = new Map<string, RemitDbProperty[]>();
  for (const p of (propsRaw ?? []) as Record<string, unknown>[]) {
    const ownerId = p.owner_id as string | null;
    if (!ownerId) continue;
    pushTo(propsByOwner, ownerId, {
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
    });
  }

  // 経費をオーナー別にグルーピング
  const expensesByOwner = new Map<string, RemitDbExpense[]>();
  for (const e of (expensesRaw ?? []) as Record<string, unknown>[]) {
    const ownerId = e.owner_id as string | null;
    if (!ownerId) continue;
    pushTo(expensesByOwner, ownerId, {
      id: e.id as string,
      description: (e.description as string) ?? "経費",
      owner_amount: Number(e.owner_amount || 0),
      property_id: (e.property_id as string) ?? null,
      unit_id: (e.unit_id as string) ?? null,
    });
  }

  const isTaxInvoiceIssuer = (company as { is_tax_invoice_issuer?: boolean })?.is_tax_invoice_issuer ?? false;
  const taxRate = (company as { management_fee_tax_rate?: number })?.management_fee_tax_rate ?? 0.1;

  const owners = (ownersRaw ?? []) as Record<string, string | null>[];
  const candidates: UnconfirmedOwnerCandidate[] = [];
  let confirmed_owners = 0;
  let confirmed_amount = 0;
  let owners_without_net = 0;

  for (const o of owners) {
    const existing = remitByOwner.get(o.id as string);

    // confirmed / sent は確定済み。サマリーに計上し、候補からはスキップ（getBatchCandidate側に出る）。
    if (existing && existing.status !== "draft") {
      if (existing.net_amount > 0) {
        confirmed_owners += 1;
        confirmed_amount += existing.net_amount;
      }
      continue;
    }

    // 事前取得データをメモリ上で割り当てて試算（DBアクセスなし）
    const result = buildRemittance({
      properties: propsByOwner.get(o.id as string) ?? [],
      billings,
      expenses: expensesByOwner.get(o.id as string) ?? [],
      isTaxInvoiceIssuer,
      taxRate,
    });
    const net = result.netAmount;
    // 送金額ゼロ（家賃なし等）は振込対象にならないので候補・サマリーから外す
    if (net <= 0) {
      owners_without_net += 1;
      continue;
    }

    const has_bank = !!(o.bank_code && o.bank_branch_code && o.bank_account_number && (o.bank_account_holder_kana || o.bank_account_holder));
    candidates.push({
      owner_id: o.id as string,
      owner_name: (o.name as string) ?? "—",
      remittance_month: month.slice(0, 7),
      preview_net_amount: net,
      existing_remittance_id: existing?.id ?? null,
      has_bank,
    });
  }

  const unconfirmed_amount = candidates.reduce((s, c) => s + c.preview_net_amount, 0);
  const summary: MonthSettlementSummary = {
    total_owners: confirmed_owners + candidates.length,
    confirmed_owners,
    unconfirmed_owners: candidates.length,
    confirmed_amount,
    unconfirmed_amount,
    registered_owners: owners.length,
    owners_without_net,
    month_paid_total: billings.reduce((sum, b) => sum + b.paid_amount, 0),
  };

  return { candidates, summary };
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
