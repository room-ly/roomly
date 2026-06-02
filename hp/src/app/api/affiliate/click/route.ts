import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// クライアントはリクエスト時に遅延生成する（環境変数の無いビルド/プレビューで落ちないように）
function getSupabase() {
  const url = process.env.ROOMLY_SUPABASE_URL;
  const key = process.env.ROOMLY_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.AFFILIATE_IP_SALT || "roomly_aff"))
    .digest("hex")
    .slice(0, 32);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code: string | undefined = body.code;
    const visitorId: string | undefined = body.visitor_id;
    const landingPath: string | undefined = body.landing_path;
    const referrer: string | undefined = body.referrer;

    if (!code || !visitorId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (!/^[A-Z0-9]{4,16}$/.test(code)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";
    const userAgent = request.headers.get("user-agent") || "";
    const url = new URL(request.url);
    const utmSource = url.searchParams.get("utm_source");
    const utmMedium = url.searchParams.get("utm_medium");
    const utmCampaign = url.searchParams.get("utm_campaign");

    // ローカル/開発機からのクリックは記録しない
    if (
      !ip ||
      ip === "::1" ||
      ip === "127.0.0.1" ||
      ip.startsWith("::ffff:192.168.") ||
      ip.startsWith("::ffff:10.")
    ) {
      return NextResponse.json({ ok: true });
    }

    // コードからaffiliate_idを引く（service_role不要、ただしanonはselect禁止なのでRPCを使う方法もあるが
    // ここはinsertのみとし、affiliate_idはservice_rolejob/webhookで遡って解決する設計でもよい。
    // ただ運用しやすさのため、本APIではaffiliate_idを毎回引く専用RPCを用意する手もあり）
    //
    // 今回は簡略化: anonからは select 禁止なので affiliate_id は null で insert し、
    // 別途バッチ or 運営UIで code → affiliate_id の解決を行う。
    // → リアルタイム性が必要なので、PostgREST の rpc で resolve する方が良いが、
    //   ここでは「affiliate_clicksにcodeとnull affiliate_idでinsert、後でDBトリガで解決」
    //   という設計を採用する。トリガは別マイグレで追加済みとする。

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ ok: true, skipped: "no-config" });

    const { error } = await supabase.from("affiliate_clicks").insert({
      code,
      visitor_id: visitorId,
      landing_path: landingPath || null,
      referrer: referrer || null,
      ip_hash: ip ? hashIp(ip) : null,
      user_agent: userAgent.slice(0, 500),
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    });

    if (error) {
      console.error("affiliate_clicks insert error:", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("affiliate click error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
