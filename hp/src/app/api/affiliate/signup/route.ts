import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  createAffiliateServerClient,
  createServiceRoleClient,
} from "@/lib/supabase-server";
import {
  extractTrackingMeta,
  logSignupAttempt,
} from "@/lib/affiliate-tracking";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const OPERATOR_EMAIL = "ryuichi.ueda@roomly.jp";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

async function notifyOperator(payload: {
  code: string;
  email: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const resend = new Resend(key);
    const dashboardUrl = `https://hp.roomly.jp/affiliate/dashboard`;
    await resend.emails.send({
      from: "Roomly <noreply@roomly.jp>",
      to: [OPERATOR_EMAIL],
      replyTo: payload.email,
      subject: `【Roomly】新規アフィリエイト登録: ${payload.email}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a365d; padding: 16px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 18px;">Roomly Affiliate</h1>
          </div>
          <div style="padding: 24px;">
            <p>新規アフィリエイトが登録されました。</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tbody>
                <tr><td style="padding: 6px 0; color: #666; width: 120px;">紹介コード</td><td style="font-family: monospace; font-weight: bold;">${payload.code}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">メールアドレス</td><td>${escapeHtml(payload.email)}</td></tr>
              </tbody>
            </table>
            <p style="margin-top: 16px;"><a href="${dashboardUrl}" style="color: #2b6cb0;">ダッシュボードを開く</a></p>
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error("affiliate signup notify error:", e);
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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const meta = extractTrackingMeta(request, body);
  const email: string | undefined = body.email?.trim()?.toLowerCase();
  const password: string | undefined = body.password;

  try {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await logSignupAttempt(meta, {
        email: email || null,
        success: false,
        error_code: "invalid_email",
      });
      return NextResponse.json(
        { error: "メールアドレスの形式が正しくありません" },
        { status: 400 }
      );
    }
    if (!password || password.length < 8) {
      await logSignupAttempt(meta, {
        email,
        success: false,
        error_code: "weak_password",
      });
      return NextResponse.json(
        { error: "パスワードは8文字以上で設定してください" },
        { status: 400 }
      );
    }

    const admin = createServiceRoleClient();

    // 新規ユーザー作成。email_confirm=trueで確認スキップ → 即signin可能。
    // 既存emailなら createUser がエラーを返す。
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: "affiliate_signup" },
    });

    if (createErr) {
      const msg = createErr.message || "";
      if (
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("registered") ||
        (createErr as { status?: number }).status === 422
      ) {
        await logSignupAttempt(meta, {
          email,
          success: false,
          error_code: "email_exists",
        });
        return NextResponse.json(
          {
            error:
              "このメールアドレスは既に登録されています。ログインからアクセスしてください。",
            existing: true,
          },
          { status: 409 }
        );
      }
      console.error("affiliate signup createUser error:", createErr);
      await logSignupAttempt(meta, {
        email,
        success: false,
        error_code: "create_user_failed",
        error_message: msg,
      });
      return NextResponse.json(
        { error: "アカウント作成に失敗しました" },
        { status: 500 }
      );
    }

    if (!created?.user) {
      await logSignupAttempt(meta, {
        email,
        success: false,
        error_code: "create_user_empty",
      });
      return NextResponse.json(
        { error: "アカウント作成に失敗しました" },
        { status: 500 }
      );
    }
    const userId = created.user.id;

    // affiliates レコードを作成(コード生成)
    let code = "";
    let attempt = 0;
    let lastError: unknown = null;
    while (attempt < 5 && !code) {
      const candidate = generateCode();
      const { error: insErr } = await admin.from("affiliates").insert({
        code: candidate,
        name: email.split("@")[0], // 仮の名前(後でプロフィールから更新可)
        email,
        status: "approved",
        approved_at: new Date().toISOString(),
        source: "self_signup",
        user_id: userId,
      });
      if (!insErr) {
        code = candidate;
        break;
      }
      if (
        insErr.code === "23505" &&
        insErr.message?.includes("affiliates_code_key")
      ) {
        attempt++;
        lastError = insErr;
        continue;
      }
      console.error("affiliate signup insert error:", insErr);
      // 作成済みAuthユーザーをロールバック
      await admin.auth.admin.deleteUser(userId);
      await logSignupAttempt(meta, {
        email,
        success: false,
        error_code: "affiliate_insert_failed",
        error_message: insErr.message,
      });
      return NextResponse.json(
        { error: "アフィリエイト登録の保存に失敗しました" },
        { status: 500 }
      );
    }
    if (!code) {
      console.error("affiliate signup code retry failed:", lastError);
      await admin.auth.admin.deleteUser(userId);
      await logSignupAttempt(meta, {
        email,
        success: false,
        error_code: "code_generation_failed",
      });
      return NextResponse.json(
        { error: "コード生成に失敗しました。時間をおいて再度お試しください" },
        { status: 500 }
      );
    }

    // セッションをCookieに焼く
    const supabase = await createAffiliateServerClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr) {
      console.error("affiliate signup signin error:", signInErr);
    }

    await notifyOperator({ code, email });
    await logSignupAttempt(meta, {
      email,
      success: true,
      affiliate_code: code,
    });

    return NextResponse.json({ ok: true, code });
  } catch (e) {
    console.error("affiliate signup unexpected error:", e);
    await logSignupAttempt(meta, {
      email: email || null,
      success: false,
      error_code: "exception",
      error_message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 400 }
    );
  }
}
