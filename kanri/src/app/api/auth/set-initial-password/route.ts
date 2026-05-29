import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// hashトークン経由（招待リンク/リセットリンク）で受け取ったaccess_tokenを使い
// service roleでパスワードを更新する。
// 通常の supabase.auth.updateUser はブラウザのcookieセッションに依存するため
// hash flow直後だとセッション確立が間に合わずハングするケースがある。
export async function POST(request: NextRequest) {
  try {
    const { access_token, password } = await request.json();

    if (!access_token || !password) {
      return NextResponse.json(
        { error: "トークンとパスワードは必須です" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上で入力してください" },
        { status: 400 }
      );
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // access_token からユーザーを特定
    const { data: { user }, error: userError } = await admin.auth.getUser(access_token);
    if (userError || !user) {
      return NextResponse.json(
        { error: "リンクが無効か期限切れです。再度招待を依頼してください。" },
        { status: 401 }
      );
    }

    // BAN中なら解除（招待後に削除→再招待の動線で復活させたいケース）
    if (user.banned_until) {
      await admin.auth.admin.updateUserById(user.id, { ban_duration: "none" });
    }

    // パスワード更新
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password,
    });

    if (updateError) {
      return NextResponse.json(
        { error: "パスワードの更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
