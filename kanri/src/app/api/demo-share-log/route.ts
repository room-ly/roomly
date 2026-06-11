import { NextRequest, NextResponse } from "next/server";
import { logDemoShareEvent } from "@/lib/demo-share-log";

// 共有機能の操作ログを記録する。
// action: 'open'（モーダルを開いた）/ 'copied'（自分で送る用にコピー）
// 'email_sent' は /api/demo-share 側で送信成功時に記録するためここでは扱わない。
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { action?: string }
      | null;
    const action = body?.action;

    if (action !== "open" && action !== "copied") {
      return NextResponse.json({ error: "invalid action" }, { status: 400 });
    }

    await logDemoShareEvent(request, { action });
    return NextResponse.json({ ok: true });
  } catch {
    // ログ失敗で操作を止めない
    return NextResponse.json({ ok: true });
  }
}
