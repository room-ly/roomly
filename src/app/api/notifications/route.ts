import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET: 通知一覧（未読優先、最新20件）
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("is_read", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: "通知の取得に失敗しました" }, { status: 500 });
    }

    const unreadCount = (data ?? []).filter((n: Record<string, unknown>) => !n.is_read).length;

    return NextResponse.json({ notifications: data ?? [], unreadCount });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

// PUT: 既読にする
export async function PUT(request: NextRequest) {
  try {
    const { ids } = await request.json();
    const supabase = await createClient();

    if (ids && Array.isArray(ids)) {
      // 指定IDを既読に
      await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    } else {
      // 全て既読に
      await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
