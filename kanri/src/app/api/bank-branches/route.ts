import { NextRequest, NextResponse } from "next/server";
import zenginData from "@/lib/zengin-data.json";

const data = zenginData as Record<string, any>;

// GET /api/bank-branches?bank=0001&q=新宿
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bankCode = searchParams.get("bank");
  const query = searchParams.get("q")?.trim().toLowerCase() || "";

  if (!bankCode) {
    return NextResponse.json({ error: "bank パラメータが必要です" }, { status: 400 });
  }

  const bank = data[bankCode];
  if (!bank?.branches) {
    return NextResponse.json([]);
  }

  const branches: { code: string; name: string; kana: string }[] = Object.values(bank.branches);

  if (!query) {
    return NextResponse.json([]);
  }

  const results = branches
    .filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.kana.toLowerCase().includes(query) ||
        b.code.includes(query)
    )
    .slice(0, 20);

  return NextResponse.json(results);
}
