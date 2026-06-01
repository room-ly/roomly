import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { SYSTEM_USER_ID } from "@/lib/system-user";

// Vercel Cron から月次で叩かれる。active契約について
// 契約開始月〜今月までの未生成 rent_billings を埋める。
// end_date / move_out_date を越えた月は生成しない。
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
};

// YYYY-MM-01 をローカル基準で組み立てる（UTCずれ防止）
function toBillingMonth(year: number, month0: number): string {
  return `${year}-${String(month0 + 1).padStart(2, "0")}-01`;
}

// billing_month と同月の末日（当月分を当月末払い）
function dueDateOf(billingMonth: string): string {
  const [y, m] = billingMonth.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  return d.toISOString().slice(0, 10);
}

// 契約から、生成すべき billing_month の配列を作る
// 契約開始月〜今月の各1日を列挙。end_date/move_out_date より後の月は除く
function billingMonthsForContract(c: Contract, todayY: number, todayM0: number): string[] {
  const start = new Date(c.start_date);
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();

  // 終了月の判定: move_out_date 優先、なければ end_date、両方なければ今月まで
  const cutoffStr = c.move_out_date ?? c.end_date ?? null;
  let endY = todayY;
  let endM = todayM0;
  if (cutoffStr) {
    const cutoff = new Date(cutoffStr);
    const cY = cutoff.getUTCFullYear();
    const cM = cutoff.getUTCMonth();
    // cutoff が今月より前ならそこまで、後なら今月まで
    if (cY < todayY || (cY === todayY && cM < todayM0)) {
      endY = cY;
      endM = cM;
    }
  }

  const months: string[] = [];
  while (y < endY || (y === endY && m <= endM)) {
    months.push(toBillingMonth(y, m));
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return months;
}

async function processRentBillings(supabase: ReturnType<typeof createAdminClient>) {
  const now = new Date();
  const todayY = now.getUTCFullYear();
  const todayM0 = now.getUTCMonth();

  // 1. active契約を全件取得
  const { data: contracts, error: contractError } = await supabase
    .from("contracts")
    .select("id, company_id, start_date, end_date, move_out_date, rent, management_fee")
    .eq("status", "active");

  if (contractError) {
    throw new Error(`契約取得失敗: ${contractError.message}`);
  }
  if (!contracts || contracts.length === 0) {
    return { generated: 0, skipped: 0, contracts: 0 };
  }

  // 2. 既存 rent_billings を一括取得（contract_id, billing_month）
  const contractIds = contracts.map((c) => c.id);
  const { data: existing, error: existingError } = await supabase
    .from("rent_billings")
    .select("contract_id, billing_month")
    .in("contract_id", contractIds);

  if (existingError) {
    throw new Error(`既存請求取得失敗: ${existingError.message}`);
  }

  const existingKeys = new Set(
    (existing ?? []).map((e) => `${e.contract_id}__${e.billing_month}`)
  );

  // 3. 不足分を組み立て
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

  for (const c of contracts as Contract[]) {
    const months = billingMonthsForContract(c, todayY, todayM0);
    const rent = Number(c.rent) || 0;
    const mgmt = Number(c.management_fee) || 0;
    for (const bm of months) {
      const key = `${c.id}__${bm}`;
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }
      toInsert.push({
        contract_id: c.id,
        billing_month: bm,
        rent,
        management_fee: mgmt,
        total_amount: rent + mgmt,
        due_date: dueDateOf(bm),
        status: "unpaid",
        company_id: c.company_id,
      });
    }
  }

  if (toInsert.length === 0) {
    return { generated: 0, skipped, contracts: contracts.length };
  }

  // 4. 一括INSERT
  // defaultToNull:false で行ごとにキーが揃わない場合のNULL補完を避ける
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
