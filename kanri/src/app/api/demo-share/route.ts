import { NextRequest, NextResponse } from "next/server";
import { sendEmail, FROM_ADDRESSES } from "@/lib/email";
import { logDemoShareEvent } from "@/lib/demo-share-log";

// デモを触った担当者が、決済者（上長・経営者）にRoomlyを共有するためのメール送信。
// 差出人は noreply@roomly.jp（システム送信）、返信先は contact@roomly.jp（商談チャンス）。
// 文面はハイブリッド: ①デモも触れるリンク ②料金・申込への導線、の両方を載せる。

const DEMO_LOGIN_URL = "https://kanri.roomly.jp/login?demo=1&from=demo-share";
const PRICING_URL = "https://hp.roomly.jp/pricing?from=demo-share";
const SIGNUP_URL = "https://kanri.roomly.jp/signup?from=demo-share";

// ざっくりしたメール形式チェック（厳密なバリデーションはしない）
function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function buildHtml(senderName: string | null): string {
  const intro = senderName
    ? `${escapeHtml(senderName)} 様より、賃貸管理SaaS「Roomly」のご共有です。`
    : `貴社のご担当者様より、賃貸管理SaaS「Roomly」のご共有です。`;

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
    <div style="background: #1a365d; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Roomly</h1>
      <p style="color: #cbd5e0; margin: 6px 0 0; font-size: 13px;">賃貸管理をもっとシンプルに</p>
    </div>
    <div style="padding: 32px 28px; background: #f7fafc;">
      <p style="font-size: 15px; line-height: 1.8; margin: 0 0 20px;">${intro}</p>
      <p style="font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
        物件・入居者・契約・家賃・修繕・オーナー送金までを一元管理できる、賃貸管理会社向けのクラウドサービスです。
        実際の画面をそのままお試しいただけます（登録不要・無料）。
      </p>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 0 0 16px;">
        <p style="font-size: 13px; color: #4a5568; margin: 0 0 12px; font-weight: 600;">① まずは触ってみる（登録不要）</p>
        <a href="${DEMO_LOGIN_URL}" style="display: inline-block; background: #2b6cb0; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">デモを開く →</a>
        <p style="font-size: 12px; color: #718096; margin: 12px 0 0;">サンプルデータ入りの管理画面が開きます。自由に操作いただけます。</p>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 0 0 24px;">
        <p style="font-size: 13px; color: #4a5568; margin: 0 0 12px; font-weight: 600;">② 料金・お申し込み</p>
        <p style="font-size: 14px; line-height: 1.7; margin: 0 0 12px;">
          〜10区画は無料。以降は区画数に応じた段階課金です（税込）。
        </p>
        <a href="${PRICING_URL}" style="color: #2b6cb0; font-size: 14px; font-weight: 600; text-decoration: none;">料金プランを見る →</a>
        <span style="color: #cbd5e0; margin: 0 8px;">|</span>
        <a href="${SIGNUP_URL}" style="color: #2b6cb0; font-size: 14px; font-weight: 600; text-decoration: none;">無料で始める →</a>
      </div>

      <p style="font-size: 13px; color: #718096; line-height: 1.7; margin: 0;">
        ご不明な点は、このメールにそのままご返信ください。担当よりご案内いたします。
      </p>
    </div>
    <div style="padding: 16px; text-align: center; color: #a0aec0; font-size: 12px;">
      © Roomly - 賃貸管理をもっとシンプルに
    </div>
  </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { to?: string; senderName?: string }
      | null;
    const to = body?.to?.trim();
    const senderName = body?.senderName?.trim() || null;

    if (!to || !isEmail(to)) {
      return NextResponse.json(
        { error: "送信先のメールアドレスを正しく入力してください" },
        { status: 400 }
      );
    }

    await sendEmail({
      to,
      subject: "【Roomly】賃貸管理SaaSのご共有 — デモをご覧いただけます",
      html: buildHtml(senderName),
      from: FROM_ADDRESSES.system, // noreply@roomly.jp
      headers: { "Reply-To": "Roomly <contact@roomly.jp>" },
    });

    // 送信成功をログに記録（失敗しても送信結果は成功で返す）
    await logDemoShareEvent(request, {
      action: "email_sent",
      recipientEmail: to,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "送信に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
