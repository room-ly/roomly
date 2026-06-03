import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Supabaseのauth cookieを確実に削除。これが消えれば次のページロードで未認証扱いになるため、
  // ユーザー体験上はここでログアウト完了。Supabase Authサーバーへのトークン失効(signOut)は
  // ネットワーク往復で約1秒かかるが、レスポンスをブロックさせる必要はないので after() で
  // レスポンス送信後に実行する（サーバーレスでも処理が打ち切られない正式なAPI）。
  const cookieNames = [
    `sb-grtiixrpqwsvxsfapsni-auth-token`,
    `sb-grtiixrpqwsvxsfapsni-auth-token.0`,
    `sb-grtiixrpqwsvxsfapsni-auth-token.1`,
  ];
  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
    });
  }

  after(async () => {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // トークン失効に失敗してもCookieは既に削除済みなのでログアウトは成立している
    }
  });

  return response;
}
