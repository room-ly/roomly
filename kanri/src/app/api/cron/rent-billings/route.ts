import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { SYSTEM_USER_ID } from "@/lib/system-user";
import {
  isClosingDay,
  billingMonthForClosing,
  calcDueDateWithCycle,
} from "@/lib/billing-status";

// Vercel Cron から日次で叩かれる。「今日が締日と一致する active契約」について
// 当月の rent_billings を生成する（既存があればスキップ）。
// end_date / move_out_date を越えた契約は生成しない。
// 全社横断で動くため service_role クライアントを使う。

export const dynamic = "force-dynamic";

type Contract = {
  id: string;
  company_id: string;
  start_date: string;
  end_date: string | null;
  move_out_date: string | null;
  rent: number | string;
  management_fee: number | string;
  closing_day: number | null;
  payment_due_day: number | null;
  payment_month_offset: number | null;
};

async function processRentBillings(supabase: ReturnType<typeof createAdminClient>) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // 1. active契約を全件取得
  const { data: contracts, error: contractError } = await supabase
    .from("contracts")
    .select(
      "id, company_id, start_date, end_date, move_out_date, rent, management_fee, closing_day, payment_due_day, payment_month_offset"
    )
    .eq("status", "active");

  if (contractError) {
    throw new Error(`契約取得失敗: ${contractError.message}`);
  }
  if (!contracts || contracts.length === 0) {
    return { generated: 0, skipped: 0, contracts: 0 };
  }

  // 2. 「今日が締日」の契約だけに絞る。契約期間外も除外
  const targets = (contracts as Contract[]).filter((c) => {
    if (!isClosingDay(now, c.closing_day)) return false;
    if (c.start_date && c.start_date > todayStr) return false;
    const cutoff = c.move_out_date ?? c.end_date;
    if (cutoff && cutoff < todayStr) return false;
    return true;
  });

  if (targets.length === 0) {
    return { generated: 0, skipped: 0, contracts: contracts.length };
  }

  // 3. 既存 rent_billings（今月分）を一括取得し冪等化
  const billingMonth = billingMonthForClosing(now);
  const targetIds = targets.map((c) => c.id);
  const { data: existing, error: existingError } = await supabase
    .from("rent_billings")
    .select("contract_id")
    .in("contract_id", targetIds)
    .eq("billing_month", billingMonth);

  if (existingError) {
    throw new Error(`既存請求取得失敗: ${existingError.message}`);
  }
  const existingContractIds = new Set((existing ?? []).map((e) => e.contract_id));

  // 4. 不足分を組み立て
  type Insert = {
    contract_id: string;
    billing_month: string;
    rent: number;
    management_fee: number;
    total_amount: number;
    due_date: string;
    status: "unpaid";
    company_id: string;
  };
  const toInsert: Insert[] = [];
  let skipped = 0;

  for (const c of targets) {
    if (existingContractIds.has(c.id)) {
      skipped++;
      continue;
    }
    const rent = Number(c.rent) || 0;
    const mgmt = Number(c.management_fee) || 0;
    toInsert.push({
      contract_id: c.id,
      billing_month: billingMonth,
      rent,
      management_fee: mgmt,
      total_amount: rent + mgmt,
      due_date: calcDueDateWithCycle(billingMonth, c.payment_due_day, c.payment_month_offset),
      status: "unpaid",
      company_id: c.company_id,
    });
  }

  if (toInsert.length === 0) {
    return { generated: 0, skipped, contracts: contracts.length };
  }

  const { error: insertError } = await supabase
    .from("rent_billings")
    .insert(toInsert, { defaultToNull: false });

  if (insertError) {
    throw new Error(`請求一括作成失敗: ${insertError.message}`);
  }

  return { generated: toInsert.length, skipped, contracts: contracts.length };
}

export async function GET(request: NextRequest) {
  // CRON_SECRET による保護。Vercel Cron は Authorization: Bearer <CRON_SECRET> を付ける
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient(SYSTEM_USER_ID);
    const result = await processRentBillings(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "処理に失敗しました";
    console.error("Cron家賃生成エラー:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
