import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestMeta, normalizeAttribution } from "@/lib/request-meta";

const MAX_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 30;

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, action, success, attribution } = body;

  if (!email) {
    return NextResponse.json({ error: "メールアドレスが必要です" }, { status: 400 });
  }

  const admin = getAdmin();
  const emailLower = String(email).toLowerCase();

  if (action === "check") {
    // 直近LOCKOUT_MINUTES分の連続失敗回数でロック判定（成功は無視）
    const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
    const { count } = await admin
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", emailLower)
      .eq("success", false)
      .gte("attempted_at", since);

    const isLocked = (count ?? 0) >= MAX_ATTEMPTS;
    return NextResponse.json({
      locked: isLocked,
      remainingAttempts: Math.max(MAX_ATTEMPTS - (count ?? 0), 0),
    });
  }

  if (action === "record") {
    // 成功・失敗どちらも記録する。広告流入の検証に使うため成功も残す
    const meta = getRequestMeta(request);
    const attr = normalizeAttribution(attribution);

    // 成功ログイン時のみ company_id / user_id を解決（失敗時はemail存在を漏らさないため引かない）
    let companyId: string | null = null;
    let userId: string | null = null;
    if (success === true) {
      const { data: u } = await admin
        .from("users")
        .select("id, company_id")
        .eq("email", emailLower)
        .maybeSingle();
      if (u) {
        companyId = u.company_id ?? null;
        userId = u.id ?? null;
      }
    }

    await admin.from("login_attempts").insert({
      email: emailLower,
      success: success === true,
      company_id: companyId,
      user_id: userId,
      ip_address: meta.ip_address,
      country: meta.country,
      region: meta.region,
      city: meta.city,
      user_agent: meta.user_agent,
      referrer: attr.referrer,
      landing_path: attr.landing_path,
      utm_source: attr.utm_source,
      utm_medium: attr.utm_medium,
      utm_campaign: attr.utm_campaign,
      utm_term: attr.utm_term,
      utm_content: attr.utm_content,
      gclid: attr.gclid,
      ga_client_id: attr.ga_client_id,
    });

    // 成功時、未設定の companies.ga_client_id を埋める（既存会社の名寄せ用）
    if (success === true && companyId && attr.ga_client_id) {
      await admin
        .from("companies")
        .update({ ga_client_id: attr.ga_client_id })
        .eq("id", companyId)
        .is("ga_client_id", null);
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "無効なアクション" }, { status: 400 });
}
