import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// service_role を使ってトークン(=アフィリエイトコード)で本人の情報・成果を返す。
// アフィリエイト用の軽量認証として、コード自体を見せられる本人にだけ閲覧を許す方針。
const supabase = createClient(
  process.env.ROOMLY_SUPABASE_URL!,
  process.env.ROOMLY_SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim().toUpperCase();
  if (!token || !/^[A-Z0-9]{4,16}$/.test(token)) {
    return NextResponse.json({ error: "無効なトークンです" }, { status: 400 });
  }

  const { data: affiliate, error: affErr } = await supabase
    .from("affiliates")
    .select(
      "id, code, name, email, status, commission_recurring_rate, commission_recurring_months, approved_at, created_at"
    )
    .eq("code", token)
    .maybeSingle();

  if (affErr) {
    console.error("affiliate me error:", affErr);
    return NextResponse.json({ error: "情報の取得に失敗しました" }, { status: 500 });
  }
  if (!affiliate) {
    return NextResponse.json({ error: "該当するアフィリエイトが見つかりません" }, { status: 404 });
  }
  if (affiliate.status !== "approved") {
    return NextResponse.json({ error: "このアカウントは現在ご利用いただけません" }, { status: 403 });
  }

  // クリック数
  const { count: clickCount } = await supabase
    .from("affiliate_clicks")
    .select("id", { count: "exact", head: true })
    .eq("affiliate_id", affiliate.id);

  // ユニーククリック (visitor_id重複排除はDB側でやるのが面倒なのでざっくり distinct on は省略し、全件カウントのみ)

  // 成果サマリ
  const { data: conversions } = await supabase
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
