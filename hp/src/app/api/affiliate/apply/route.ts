import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.ROOMLY_SUPABASE_URL!,
  process.env.ROOMLY_SUPABASE_ANON_KEY!
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

    // 既存メアドチェックは anon select 禁止なので、insertしてエラー判定する
    // ただしユニーク制約はemailにかかっていないので、同一メアドの重複申込はまずチェック不可
    // → 申込時点は重複OK、運営承認時に統合判断する設計とする

    // ユニークコードを生成（最大5回リトライ）
    let inserted = false;
    let attempt = 0;
    let lastError: unknown = null;
    while (attempt < 5 && !inserted) {
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
        status: "pending",
        source: "self_signup",
      });
      if (!error) {
        inserted = true;
        break;
      }
      // ユニーク制約違反ならリトライ、それ以外はエラー
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

    if (!inserted) {
      console.error("affiliate apply failed after retries:", lastError);
      return NextResponse.json(
        { error: "コード生成に失敗しました。時間をおいて再度お試しください" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("affiliate apply unexpected error:", e);
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 400 }
    );
  }
}
