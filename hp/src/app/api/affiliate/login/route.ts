import { NextRequest, NextResponse } from "next/server";
import {
  createAffiliateServerClient,
  createServiceRoleClient,
} from "@/lib/supabase-server";
import {
  extractTrackingMeta,
  logLoginAttempt,
} from "@/lib/affiliate-tracking";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const meta = extractTrackingMeta(request, body);
  const email: string | undefined = body.email?.trim()?.toLowerCase();
  const password: string | undefined = body.password;

  if (!email || !password) {
    await logLoginAttempt(meta, {
      email: email || null,
      success: false,
    });
    return NextResponse.json(
      { error: "メールアドレスとパスワードを入力してください" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createAffiliateServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      await logLoginAttempt(meta, { email, success: false });
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        { status: 401 }
      );
    }

    // 当該ユーザーがaffiliateであることを確認(任意の安全策)
    const admin = createServiceRoleClient();
    const { data: affiliate } = await admin
      .from("affiliates")
      .select("code, status")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!affiliate || affiliate.status !== "approved") {
      // affiliateレコードがない/承認されてないユーザー
      await supabase.auth.signOut();
      await logLoginAttempt(meta, { email, success: false });
      return NextResponse.json(
        {
          error:
            "アフィリエイトアカウントとして登録されていません。新規登録からアクセスしてください。",
        },
        { status: 403 }
      );
    }

    await logLoginAttempt(meta, {
      email,
      success: true,
      affiliate_code: affiliate.code,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("affiliate login error:", e);
    await logLoginAttempt(meta, { email, success: false });
    return NextResponse.json(
      { error: "ログイン処理に失敗しました" },
      { status: 500 }
    );
  }
}
