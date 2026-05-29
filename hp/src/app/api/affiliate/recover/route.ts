import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";

// パスワードリセットメールを送信。Supabase Auth の generateLink (recovery) を使い、
// 自前のRoomly署名のメールテンプレートで送りたいので最終的には別実装する想定。
// MVPでは Supabase 標準のメール送信を利用する。
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email: string | undefined = body.email?.trim()?.toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "メールアドレスの形式が正しくありません" },
        { status: 400 }
      );
    }

    const admin = createServiceRoleClient();

    // 該当ユーザーがaffiliateとして登録されているか確認(無くても同じレスポンスを返す)
    const { data: affiliate } = await admin
      .from("affiliates")
      .select("id, user_id")
      .eq("email", email)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (affiliate?.user_id) {
      // Supabase標準のパスワードリセットメール
      try {
        await admin.auth.resetPasswordForEmail(email, {
          redirectTo: "https://hp.roomly.jp/affiliate/update-password",
        });
      } catch (e) {
        console.error("affiliate recover sendmail error:", e);
      }
    }

    // メアド存在の有無は漏らさず、常に同じ応答
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("affiliate recover unexpected error:", e);
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 400 }
    );
  }
}
