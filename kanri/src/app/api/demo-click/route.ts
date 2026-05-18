import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PREFECTURE_MAP: Record<string, string> = {
  "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県",
  "05": "秋田県", "06": "山形県", "07": "福島県", "08": "茨城県",
  "09": "栃木県", "10": "群馬県", "11": "埼玉県", "12": "千葉県",
  "13": "東京都", "14": "神奈川県", "15": "新潟県", "16": "富山県",
  "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
  "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県",
  "25": "滋賀県", "26": "京都府", "27": "大阪府", "28": "兵庫県",
  "29": "奈良県", "30": "和歌山県", "31": "鳥取県", "32": "島根県",
  "33": "岡山県", "34": "広島県", "35": "山口県", "36": "徳島県",
  "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
  "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県",
  "45": "宮崎県", "46": "鹿児島県", "47": "沖縄県",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";
    const country = request.headers.get("x-vercel-ip-country") || "";
    const regionCode = request.headers.get("x-vercel-ip-country-region") || "";
    const city = request.headers.get("x-vercel-ip-city") || "";
    const region = country === "JP" ? (PREFECTURE_MAP[regionCode] || regionCode) : regionCode;

    await supabase.from("demo_clicks").insert({
      project: "roomly",
      location: "login",
      ip,
      country,
      region,
      city: decodeURIComponent(city),
      user_agent: userAgent,
      referrer,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
