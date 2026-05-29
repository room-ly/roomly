import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// service_role を使うことで status='approved' を含む任意のINSERTが可能になる。
// 即時発行フローのためanon RLSの「pending+self_signup限定」制約を回避する。
const supabase = createClient(
  process.env.ROOMLY_SUPABASE_URL!,
  process.env.ROOMLY_SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const OPERATOR_EMAIL = "ryuichi.ueda@roomly.jp";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

const VALID_PROSPECT_TYPES = new Set([
  "blogger",
  "influencer",
  "community",
  "professional",
  "other",
]);

const PROSPECT_TYPE_LABEL: Record<string, string> = {
  blogger: "ブログ・メディア運営",
  influencer: "SNS・YouTube発信者",
  community: "大家会・コミュニティ運営",
  professional: "税理士・司法書士・FP等の士業",
  other: "その他",
};

async function notifyOperator(payload: {
  code: string;
  name: string;
  email: string;
  phone: string | null;
  prospectType: string | null;
  websiteUrl: string | null;
  socialUrl: string | null;
  notes: string | null;
  reused: boolean;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const resend = new Resend(key);
    const subject = payload.reused
      ? `【Roomly】既存アフィリエイト再ログイン: ${payload.name}`
      : `【Roomly】新規アフィリエイト登録: ${payload.name}`;
    const dashboardUrl = `https://hp.roomly.jp/affiliate/dashboard?token=${payload.code}`;
    const prospectLabel = payload.prospectType
      ? PROSPECT_TYPE_LABEL[payload.prospectType] || payload.prospectType
      : "—";
    await resend.emails.send({
      from: "Roomly <noreply@roomly.jp>",
      to: [OPERATOR_EMAIL],
      replyTo: payload.email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a365d; padding: 16px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 18px;">Roomly Affiliate</h1>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 16px;">${payload.reused ? "既存アフィリエイトが再ログイン用のフォーム送信を行いました。" : "新規アフィリエイトが登録されました。"}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tbody>
                <tr><td style="padding: 6px 0; color: #666; width: 120px;">紹介コード</td><td style="font-family: monospace; font-weight: bold;">${payload.code}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">お名前</td><td>${escapeHtml(payload.name)}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">メールアドレス</td><td>${escapeHtml(payload.email)}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">電話番号</td><td>${escapeHtml(payload.phone || "—")}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">活動カテゴリ</td><td>${escapeHtml(prospectLabel)}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Webサイト</td><td>${linkify(payload.websiteUrl)}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">SNS等</td><td>${linkify(payload.socialUrl)}</td></tr>
                <tr><td style="padding: 6px 0; color: #666; vertical-align: top;">メモ</td><td style="white-space: pre-wrap;">${escapeHtml(payload.notes || "—")}</td></tr>
              </tbody>
            </table>
            <p style="margin-top: 20px;">
              <a href="${dashboardUrl}" style="color: #2b6cb0;">本人のダッシュボードを開く</a>
            </p>
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error("affiliate operator notify error:", e);
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

function linkify(url: string | null): string {
  if (!url) return "—";
  const safe = escapeHtml(url);
  return `<a href="${safe}" style="color: #2b6cb0;">${safe}</a>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name: string | undefined = body.name?.trim();
    const email: string | undefined = body.email?.trim()?.toLowerCase();
    const phone: string | null = body.phone || null;
    const prospectType: string | null = body.prospect_type || null;
    const websiteUrl: string | null = body.website_url || null;
    const socialUrl: string | null = body.social_url || null;
    const notes: string | null = body.notes || null;

    if (!name || !email) {
      return NextResponse.json(
        { error: "お名前とメールアドレスは必須です" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "メールアドレスの形式が正しくありません" },
        { status: 400 }
      );
    }
    if (prospectType && !VALID_PROSPECT_TYPES.has(prospectType)) {
      return NextResponse.json(
        { error: "カテゴリの値が不正です" },
        { status: 400 }
      );
    }

    // 同一メアドの既存承認済みアカウントがあれば、そのコードを返して使い回す。
    const { data: existing } = await supabase
      .from("affiliates")
      .select("code, status")
      .eq("email", email)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (existing?.code) {
      await notifyOperator({
        code: existing.code,
        name,
        email,
        phone,
        prospectType,
        websiteUrl,
        socialUrl,
        notes,
        reused: true,
      });
      return NextResponse.json({ ok: true, code: existing.code, reused: true });
    }

    // ユニークコードを生成（最大5回リトライ）
    let attempt = 0;
    let lastError: unknown = null;
    while (attempt < 5) {
      const code = generateCode();
      const { error } = await supabase.from("affiliates").insert({
        code,
        name,
        email,
        phone,
        prospect_type: prospectType,
        website_url: websiteUrl,
        social_url: socialUrl,
        notes,
        status: "approved",
        approved_at: new Date().toISOString(),
        source: "self_signup",
      });
      if (!error) {
        await notifyOperator({
          code,
          name,
          email,
          phone,
          prospectType,
          websiteUrl,
          socialUrl,
          notes,
          reused: false,
        });
        return NextResponse.json({ ok: true, code });
      }
      if (
        error.code === "23505" &&
        (error.message?.includes("affiliates_code_key") ||
          error.message?.includes("code"))
      ) {
        attempt++;
        lastError = error;
        continue;
      }
      console.error("affiliate apply error:", error);
      return NextResponse.json(
        { error: "申込の保存に失敗しました" },
        { status: 500 }
      );
    }

    console.error("affiliate apply failed after retries:", lastError);
    return NextResponse.json(
      { error: "コード生成に失敗しました。時間をおいて再度お試しください" },
      { status: 500 }
    );
  } catch (e) {
    console.error("affiliate apply unexpected error:", e);
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 400 }
    );
  }
}
