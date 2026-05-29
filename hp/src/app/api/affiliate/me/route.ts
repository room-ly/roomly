import { NextResponse } from "next/server";
import {
  createAffiliateServerClient,
  createServiceRoleClient,
} from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createAffiliateServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const admin = createServiceRoleClient();

  const { data: affiliate, error: affErr } = await admin
    .from("affiliates")
    .select(
      "id, code, name, email, status, commission_recurring_rate, commission_recurring_months, approved_at, created_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (affErr) {
    console.error("affiliate me error:", affErr);
    return NextResponse.json(
      { error: "情報の取得に失敗しました" },
      { status: 500 }
    );
  }
  if (!affiliate) {
    return NextResponse.json(
      { error: "アフィリエイトアカウントが見つかりません" },
      { status: 404 }
    );
  }
  if (affiliate.status !== "approved") {
    return NextResponse.json(
      { error: "このアカウントは現在ご利用いただけません" },
      { status: 403 }
    );
  }

  const { count: clickCount } = await admin
    .from("affiliate_clicks")
    .select("id", { count: "exact", head: true })
    .eq("affiliate_id", affiliate.id);

  const { data: conversions } = await admin
    .from("affiliate_conversions")
    .select("status, amount_jpy, occurred_at, conversion_type")
    .eq("affiliate_id", affiliate.id)
    .order("occurred_at", { ascending: false })
    .limit(50);

  const sum = (rows: { amount_jpy: number }[]) =>
    rows.reduce((acc, r) => acc + (r.amount_jpy || 0), 0);

  const pending = (conversions || []).filter((c) => c.status === "pending");
  const approved = (conversions || []).filter((c) => c.status === "approved");
  const paid = (conversions || []).filter((c) => c.status === "paid");

  return NextResponse.json({
    affiliate: {
      code: affiliate.code,
      name: affiliate.name,
      email: affiliate.email,
      commission_recurring_rate: affiliate.commission_recurring_rate,
      commission_recurring_months: affiliate.commission_recurring_months,
      approved_at: affiliate.approved_at,
      created_at: affiliate.created_at,
    },
    stats: {
      click_count: clickCount || 0,
      conversion_count: conversions?.length || 0,
      pending_amount_jpy: sum(pending),
      approved_amount_jpy: sum(approved),
      paid_amount_jpy: sum(paid),
    },
    recent_conversions: (conversions || []).slice(0, 10).map((c) => ({
      status: c.status,
      amount_jpy: c.amount_jpy,
      occurred_at: c.occurred_at,
      conversion_type: c.conversion_type,
    })),
  });
}
