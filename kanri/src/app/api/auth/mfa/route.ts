import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const factors = data?.totp ?? data?.all?.filter((f: any) => f.factor_type === "totp") ?? [];
  const enrolled = factors.length > 0;
  return NextResponse.json({ enrolled, factors });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { action, factorId, code } = await request.json();

  if (action === "enroll") {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Roomly認証アプリ",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
  }

  if (action === "verify") {
    if (!factorId || !code) {
      return NextResponse.json({ error: "factorIdとcodeが必要です" }, { status: 400 });
    }
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (vErr) return NextResponse.json({ error: "認証コードが正しくありません" }, { status: 400 });

    return NextResponse.json({ ok: true });
  }

  if (action === "unenroll") {
    if (!factorId) {
      return NextResponse.json({ error: "factorIdが必要です" }, { status: 400 });
    }
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "無効なアクション" }, { status: 400 });
}
