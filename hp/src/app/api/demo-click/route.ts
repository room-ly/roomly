import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.ROOMLY_SUPABASE_URL!,
  process.env.ROOMLY_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { location: loc } = await request.json();

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    let country = "";
    let city = "";
    // Vercelはgeo headerを自動付与
    country = request.headers.get("x-vercel-ip-country") || "";
    city = request.headers.get("x-vercel-ip-city") || "";

    await supabase.from("demo_clicks").insert({
      project: "roomly",
      location: loc || "unknown",
      ip,
      country,
      city: decodeURIComponent(city),
      user_agent: userAgent,
      referrer,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
