import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

/**
 * GET /api/email/test?to=xxx@example.com
 * メール送信テスト用エンドポイント（開発環境のみ）
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "テスト送信は開発環境でのみ利用可能です" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json(
      { error: "to パラメータを指定してください（例: /api/email/test?to=you@example.com）" },
      { status: 400 }
    );
  }

  try {
    const data = await sendEmail({
      to,
      subject: "【Roomly】メール送信テスト",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a365d; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Roomly</h1>
          </div>
          <div style="padding: 30px; background: #f7fafc;">
            <h2 style="color: #1a365d;">メール送信テスト成功</h2>
            <p>このメールが届いていれば、Resend によるメール送信が正常に動作しています。</p>
            <p style="color: #666; font-size: 14px;">送信日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</p>
          </div>
          <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
            © Roomly - 賃貸管理をもっとシンプルに
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "送信失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
