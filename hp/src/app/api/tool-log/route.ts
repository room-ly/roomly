import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// クライアントはリクエスト時に遅延生成する。
// トップレベルで createClient すると、環境変数の無いビルド/プレビュー環境で
// 「supabaseUrl is required」でビルドが落ちるため。
function getSupabase() {
  const url = process.env.ROOMLY_SUPABASE_URL;
  const key = process.env.ROOMLY_SUPABASE_SERVICE_ROLE_KEY || process.env.ROOMLY_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const ALLOWED_TOOLS = new Set([
  "management-fee",
  "restoration-burden",
  "vacancy-loss",
  "self-vs-outsource",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool_slug, inputs, result } = body || {};

    if (!tool_slug || !ALLOWED_TOOLS.has(tool_slug)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (!inputs || typeof inputs !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";

    // ローカル/プライベートIPはログ不要
    if (
      !ip ||
      ip === "::1" ||
      ip === "127.0.0.1" ||
      ip.startsWith("::ffff:192.168.") ||
      ip.startsWith("::ffff:10.") ||
      ip.startsWith("::ffff:172.")
    ) {
      return NextResponse.json({ ok: true, skipped: "local" });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const referer = request.headers.get("referer") || "";

    const supabase = getSupabase();
    if (!supabase) {
      // 環境変数未設定（プレビュー等）ではログを取らずに正常終了
      return NextResponse.json({ ok: true, skipped: "no-config" });
    }

    await supabase.from("tool_logs").insert({
      tool_slug,
      inputs,
      result: result ?? null,
      ip,
      user_agent: userAgent,
      referer,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

// CIからのVercel自動デプロイ疎通確認
