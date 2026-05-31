import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/email-unsubscribe";

// Gmail等のメーラーからのワンクリック解除(List-Unsubscribe-Post)
// 200 を返せばOK。レスポンス本文は表示されない
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return new NextResponse("missing token", { status: 400 });

  const result = await unsubscribeByToken(token);
  if (!result.ok) return new NextResponse("invalid token", { status: 404 });

  return new NextResponse("unsubscribed", { status: 200 });
}
