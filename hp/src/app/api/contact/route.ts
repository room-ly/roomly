import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY が設定されていません");
  return new Resend(key);
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const resend = getResend();
    const { name, email, company, message, type } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "お名前・メールアドレス・お問い合わせ内容は必須です" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const typeLabel = type || "一般的なお問い合わせ";

    // Supabase inquiriesテーブルに保存（設定されている場合のみ）
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("inquiries").insert({
        project: "roomly",
        type: typeLabel,
        name,
        email,
        company: company || null,
        message,
        status: "new",
      });
    }

    // 自動返信 + CC で自分にも届く（1通で完結）
    await resend.emails.send({
      from: "Roomly <noreply@roomly.jp>",
      replyTo: "contact@roomly.jp",
      to: [email],
      cc: ["contact@roomly.jp"],
      subject: `【Roomly】お問い合わせを受け付けました（${typeLabel}）`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a365d; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Roomly</h1>
          </div>
          <div style="padding: 30px;">
            <p>${name} 様${company ? `（${company}）` : ""}</p>
            <p>お問い合わせいただきありがとうございます。<br>以下の内容で受け付けました。担当者より折り返しご連絡いたします。</p>
            <div style="margin: 20px 0; padding: 16px; background: #f7fafc; border-radius: 8px; border-left: 4px solid #2b6cb0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #666;">種別: ${typeLabel}</p>
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="color: #666; font-size: 14px;">※このメールは自動送信です。返信は contact@roomly.jp までお願いいたします。</p>
          </div>
          <div style="padding: 15px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee;">
            &copy; Roomly - 賃貸管理をもっとシンプルに
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("お問い合わせメール送信エラー:", error);
    const message =
      error instanceof Error ? error.message : "送信に失敗しました";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
