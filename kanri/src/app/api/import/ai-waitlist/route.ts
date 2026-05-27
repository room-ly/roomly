import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { sendEmail, FROM_ADDRESSES } from "@/lib/email";

// AIインポート機能の事前登録（待機リスト）
// 機能リリース時に通知するためのメール受付
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, note } = body as {
      type?: string;
      email?: string;
      note?: string;
    };

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // ログイン中ユーザー情報を取得（任意）
    let companyId: string | null = null;
    let userEmail: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userEmail = user?.email ?? null;
      companyId = await getCompanyId();
    } catch {
      // 未ログイン状態でも受け付ける
    }

    const label =
      type === "properties" ? "物件" : type === "units" ? "部屋" : type === "tenants" ? "入居者" : type ?? "不明";

    // 運営宛に通知メール送信
    await sendEmail({
      from: FROM_ADDRESSES.system,
      to: "contact@roomly.jp",
      subject: `[AIインポート 事前登録] ${label} / ${email}`,
      html: `
        <h2>AIインポート機能の事前登録</h2>
        <table style="border-collapse: collapse;">
          <tr><td style="padding: 4px 12px 4px 0;"><strong>対象</strong></td><td>${label}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>通知先メール</strong></td><td>${email}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>ログインユーザー</strong></td><td>${userEmail ?? "（未ログイン）"}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>会社ID</strong></td><td>${companyId ?? "（未取得）"}</td></tr>
        </table>
        ${note ? `<h3>要望・現状のフォーマット</h3><pre style="white-space: pre-wrap; background: #f7fafc; padding: 12px; border-radius: 6px;">${escapeHtml(note)}</pre>` : ""}
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
