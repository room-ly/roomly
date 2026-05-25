import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  sendOverdueNotification,
  sendContractExpiryReminder,
} from "@/lib/notifications";

// Vercel Cron から日次で叩かれる。滞納・契約満了の通知メールを送る。
// 全社横断で処理するため service_role クライアントを使う。

export const dynamic = "force-dynamic";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// 滞納通知: status=overdue かつ 本日まだ通知していない請求を抽出して送信
async function processOverdue(supabase: ReturnType<typeof createAdminClient>) {
  const t = today();
  const { data: billings, error } = await supabase
    .from("rent_billings")
    .select(
      "id, billing_month, total_amount, overdue_notified_at, contract:contracts(tenant:tenants(name, email), unit:units(unit_number, property:properties(name)))"
    )
    .eq("status", "overdue");

  if (error) throw new Error(`滞納抽出失敗: ${error.message}`);

  let sent = 0;
  let skipped = 0;
  for (const b of billings ?? []) {
    const row = b as Record<string, any>;
    // 本日すでに通知済みならスキップ（毎日送らない）
    if (row.overdue_notified_at === t) {
      skipped++;
      continue;
    }
    const tenant = row.contract?.tenant;
    const unit = row.contract?.unit;
    if (!tenant?.email) {
      skipped++;
      continue;
    }

    try {
      await sendOverdueNotification({
        to: tenant.email,
        tenantName: tenant.name ?? "",
        propertyName: unit?.property?.name ?? "",
        unitNumber: unit?.unit_number ?? "",
        billingMonth: String(row.billing_month).slice(0, 7),
        amount: Number(row.total_amount),
      });
      await supabase
        .from("rent_billings")
        .update({ overdue_notified_at: t })
        .eq("id", row.id);
      sent++;
    } catch {
      // 1件の失敗で全体を止めない
      skipped++;
    }
  }
  return { sent, skipped, total: billings?.length ?? 0 };
}

// 契約満了リマインダー: active かつ end_date が30日以内、本日未通知の契約を抽出して送信
async function processExpiry(supabase: ReturnType<typeof createAdminClient>) {
  const t = today();
  const limit = new Date();
  limit.setDate(limit.getDate() + 30);
  const limitStr = limit.toISOString().slice(0, 10);

  const { data: contracts, error } = await supabase
    .from("contracts")
    .select(
      "id, end_date, expiry_notified_at, tenant:tenants(name, email), unit:units(unit_number, property:properties(name))"
    )
    .eq("status", "active")
    .gte("end_date", t)
    .lte("end_date", limitStr);

  if (error) throw new Error(`契約満了抽出失敗: ${error.message}`);

  let sent = 0;
  let skipped = 0;
  for (const c of contracts ?? []) {
    const row = c as Record<string, any>;
    // 30日リマインダーは1度だけ。送信済みならスキップ
    if (row.expiry_notified_at) {
      skipped++;
      continue;
    }
    const tenant = row.tenant;
    const unit = row.unit;
    if (!tenant?.email) {
      skipped++;
      continue;
    }

    const remainingDays = Math.ceil(
      (new Date(row.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    try {
      await sendContractExpiryReminder({
        to: tenant.email,
        tenantName: tenant.name ?? "",
        propertyName: unit?.property?.name ?? "",
        unitNumber: unit?.unit_number ?? "",
        endDate: row.end_date,
        remainingDays,
      });
      await supabase
        .from("contracts")
        .update({ expiry_notified_at: t })
        .eq("id", row.id);
      sent++;
    } catch {
      skipped++;
    }
  }
  return { sent, skipped, total: contracts?.length ?? 0 };
}

export async function GET(request: NextRequest) {
  // CRON_SECRET による保護。Vercel Cron は Authorization: Bearer <CRON_SECRET> を付ける
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const overdue = await processOverdue(supabase);
    const expiry = await processExpiry(supabase);
    return NextResponse.json({ ok: true, overdue, expiry });
  } catch (err) {
    const message = err instanceof Error ? err.message : "処理に失敗しました";
    console.error("Cron通知エラー:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
