import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// service_role を使うことで status='approved' を含む任意のINSERTが可能になる。
// 即時発行フローのためanon RLSの「pending+self_signup限定」制約を回避する。
const supabase = createClient(
  process.env.ROOMLY_SUPABASE_URL!,
  process.env.ROOMLY_SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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
    // service_role なので select 可能。
    const { data: existing } = await supabase
      .from("affiliates")
      .select("code, status")
      .eq("email", email)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (existing?.code) {
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
