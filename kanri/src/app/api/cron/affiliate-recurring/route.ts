import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 月次cron: アフィリエイトの継続報酬(recurring_payment)を計上する。
// 毎月1日に叩かれ、前月分の継続報酬を生成する想定。
//
// 計上ロジック:
//   - subscription_status = 'active' かつ affiliate_id が紐付いている companies が対象
//   - 各 affiliate の commission_recurring_months を超えていない月のみ計上
//   - recurring_month_index: subscription_started_at から数えた継続月数 (1〜)
//     - 初回有料化月は first_payment で計上済みなので、2ヶ月目から計上
//   - 報酬額: その月のプラン金額 × commission_recurring_rate / 100
//   - 同一company・同一月の重複防止はDBユニーク制約で保証
//
// 報酬ステータスは 'pending' で生成 → 運営が承認/却下する

export const dynamic = "force-dynamic";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// 区画数別の月額（HP記載と一致）
function priceForMaxUnits(maxUnits: number): number {
  if (maxUnits <= 10) return 0;
  if (maxUnits <= 50) return 5000;
  if (maxUnits <= 100) return 10000;
  if (maxUnits <= 300) return 15000;
  if (maxUnits <= 500) return 20000;
  if (maxUnits <= 1000) return 25000;
  if (maxUnits <= 2000) return 30000;
  // 2,001区画〜は1,000区画ごとに+5000
  const extra = Math.ceil((maxUnits - 2000) / 1000);
  return 30000 + extra * 5000;
}

// 月数差(年×12 + 月差)
function monthIndex(from: Date, to: Date): number {
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth());
}

type Job = {
  affiliate_id: string;
  company_id: string;
  recurring_month_index: number;
  mrr: number;
  rate: number;
  amount: number;
};

async function processRecurring(): Promise<{
  scanned: number;
  inserted: number;
  skipped: number;
  errors: number;
}> {
  const admin = getAdmin();

  // 「今月」の継続報酬を計上する。
  // recurring_month_index は subscription_started_at から数えた月数 (初回月=0、2ヶ月目=1)。
  // first_payment は initial の意味で、recurring は index >= 1 から開始。
  const now = new Date();

  // 対象: subscription_status=active + affiliate_id IS NOT NULL + subscription_started_at IS NOT NULL
  const { data: companies, error: companiesError } = await admin
    .from("companies")
    .select(
      "id, affiliate_id, subscription_status, subscription_started_at, plan, max_units"
    )
    .eq("subscription_status", "active")
    .not("affiliate_id", "is", null)
    .not("subscription_started_at", "is", null);

  if (companiesError) {
    throw new Error(`companies query failed: ${companiesError.message}`);
  }

  if (!companies || companies.length === 0) {
    return { scanned: 0, inserted: 0, skipped: 0, errors: 0 };
  }

  // affiliate_idの一覧を集めて、それぞれのcommission設定を取得
  const affiliateIds = [...new Set(companies.map((c) => c.affiliate_id))];
  const { data: affiliates, error: affiliatesError } = await admin
    .from("affiliates")
    .select(
      "id, status, commission_recurring_rate, commission_recurring_months"
    )
    .in("id", affiliateIds);
  if (affiliatesError) {
    throw new Error(`affiliates query failed: ${affiliatesError.message}`);
  }

  const affiliateMap = new Map(
    (affiliates ?? []).map((a) => [a.id, a])
  );

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  const jobs: Job[] = [];

  for (const c of companies) {
    const aff = affiliateMap.get(c.affiliate_id);
    if (!aff) {
      skipped++;
      continue;
    }
    // suspended/rejected アフィリエイトは計上しない
    if (aff.status !== "active") {
      skipped++;
      continue;
    }

    const startedAt = new Date(c.subscription_started_at);
    const idx = monthIndex(startedAt, now);
    // index=0 は初回月（first_paymentで計上済み）。 recurring は1ヶ月目以降。
    if (idx < 1) {
      skipped++;
      continue;
    }
    if (idx > aff.commission_recurring_months) {
      skipped++;
      continue;
    }

    const mrr = priceForMaxUnits(c.max_units ?? 10);
    if (mrr <= 0) {
      skipped++;
      continue;
    }
    const amount = Math.floor((mrr * aff.commission_recurring_rate) / 100);
    if (amount <= 0) {
      skipped++;
      continue;
    }

    jobs.push({
      affiliate_id: aff.id,
      company_id: c.id,
      recurring_month_index: idx,
      mrr,
      rate: aff.commission_recurring_rate,
      amount,
    });
  }

  // バルクinsert（ユニーク制約で重複は弾かれる）
  for (const j of jobs) {
    const { error } = await admin.from("affiliate_conversions").insert({
      affiliate_id: j.affiliate_id,
      company_id: j.company_id,
      conversion_type: "recurring_payment",
      amount_jpy: j.amount,
      mrr_at_conversion_jpy: j.mrr,
      recurring_month_index: j.recurring_month_index,
      status: "pending",
      notes: `継続報酬 ${j.recurring_month_index}ヶ月目 (MRR ¥${j.mrr.toLocaleString()} × ${j.rate}%)`,
    });
    if (error) {
      // 23505 = ユニーク制約違反（既に計上済み）
      if (error.code === "23505") {
        skipped++;
        continue;
      }
      console.error("recurring insert error:", error);
      errors++;
      continue;
    }
    inserted++;
  }

  return {
    scanned: companies.length,
    inserted,
    skipped,
    errors,
  };
}

export async function GET(request: NextRequest) {
  // CRON_SECRET による保護
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  try {
    const result = await processRecurring();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "処理に失敗しました";
    console.error("affiliate recurring cron error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
