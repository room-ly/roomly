import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// 紹介コードを忘れた人向けの再発行（メールに本人のダッシュボードURLを送る）。
// セキュリティ上、メアドの存在有無は明かさず、常に「送信しました」と返す。
const supabase = createClient(
  process.env.ROOMLY_SUPABASE_URL!,
  process.env.ROOMLY_SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

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

    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("code, name, email, status")
      .eq("email", email)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (affiliate?.code) {
      const key = process.env.RESEND_API_KEY;
      if (key) {
        try {
          const resend = new Resend(key);
          const dashboardUrl = `https://hp.roomly.jp/affiliate/dashboard?token=${affiliate.code}`;
          const referralUrl = `https://hp.roomly.jp/?ref=${affiliate.code}`;
          await resend.emails.send({
            from: "Roomly <noreply@roomly.jp>",
            to: [affiliate.email],
            replyTo: "ryuichi.ueda@roomly.jp",
            subject: "【Roomly】アフィリエイトダッシュボードURLのご案内",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a365d; padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 22px;">Roomly Affiliate</h1>
                </div>
                <div style="padding: 28px;">
                  <p>${escapeHtml(affiliate.name)} 様</p>
                  <p>ご登録のメールアドレス宛に、アフィリエイトダッシュボードのURLをお送りします。</p>

                  <div style="margin: 24px 0; padding: 16px; background: #f7fafc; border-radius: 8px; border-left: 4px solid #2b6cb0;">
                    <p style="margin: 0 0 6px; font-size: 12px; color: #666;">ダッシュボードURL</p>
                    <p style="margin: 0; word-break: break-all;"><a href="${dashboardUrl}" style="color: #2b6cb0;">${dashboardUrl}</a></p>
                  </div>

                  <div style="margin: 16px 0; padding: 16px; background: #f7fafc; border-radius: 8px; border-left: 4px solid #2b6cb0;">
                    <p style="margin: 0 0 6px; font-size: 12px; color: #666;">紹介リンク</p>
                    <p style="margin: 0; word-break: break-all;"><a href="${referralUrl}" style="color: #2b6cb0;">${referralUrl}</a></p>
                    <p style="margin: 8px 0 0; font-size: 12px; color: #666;">紹介コード: <span style="font-family: monospace; color: #1a365d;">${affiliate.code}</span></p>
                  </div>

                  <p style="font-size: 13px; color: #666;">心当たりがない場合は、このメールを破棄してください。</p>
                </div>
                <div style="padding: 15px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee;">
                  &copy; Roomly - 賃貸管理をもっとシンプルに
                </div>
              </div>
            `,
          });
        } catch (e) {
          console.error("affiliate recover send error:", e);
        }
      }
    }

    // メアド存在の有無を漏らさないため、常に同じ応答を返す
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("affiliate recover unexpected error:", e);
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 400 }
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
