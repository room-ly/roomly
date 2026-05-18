import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  const { email, action, success } = body;

  if (!email) {
    return NextResponse.json({ error: "メールアドレスが必要です" }, { status: 400 });
  }

  const admin = getAdmin();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const emailLower = email.toLowerCase();

  if (action === "check") {
    const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
    const { count } = await admin
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", emailLower)
      .eq("success", false)
      .gte("attempted_at", since);

    const isLocked = (count ?? 0) >= MAX_ATTEMPTS;
    return NextResponse.json({ locked: isLocked, remainingAttempts: Math.max(MAX_ATTEMPTS - (count ?? 0), 0) });
  }

  if (action === "record") {
    // クライアントからはfailure記録のみ許可（success:trueはサーバー側で処理すべき）
    await admin.from("login_attempts").insert({
      email: emailLower,
      success: false,
      ip_address: ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "clear" && success) {
    // ログイン成功後のクリアは認証済みセッションからのみ許可
    const { createClient: createAuthClient } = await import("@/lib/supabase-server");
    const supabase = await createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email?.toLowerCase() !== emailLower) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    await admin
      .from("login_attempts")
      .delete()
      .eq("email", emailLower)
      .eq("success", false);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "無効なアクション" }, { status: 400 });
}
