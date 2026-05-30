import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface AuditLogRow {
  id: string;
  table_name: string;
  record_id: string;
  action: "create" | "update" | "delete";
  user_id: string | null;
  created_at: string;
  before_values: Record<string, unknown> | null;
  after_values: Record<string, unknown> | null;
}

// 監査ログ取得
// クエリ:
//   ?table=properties&record_id=xxx&limit=20 — 特定レコードの履歴
//   ?limit=50 — 会社全体の最新履歴
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const recordId = searchParams.get("record_id");
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);

    // database.types.ts に audit_logs が未生成なので from を string キャストで叩く
    let query = (supabase.from as any)("audit_logs")
      .select("id, table_name, record_id, action, user_id, created_at, before_values, after_values")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (table) query = query.eq("table_name", table);
    if (recordId) query = query.eq("record_id", recordId);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
    }

    const rows = (data ?? []) as AuditLogRow[];

    // user_idを name に解決（同じ会社の users から）
    const userIds = Array.from(new Set(rows.map((l) => l.user_id).filter(Boolean))) as string[];
    let userMap: Record<string, { name: string; email: string }> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds);
      userMap = Object.fromEntries(
        (users ?? []).map((u) => [u.id, { name: u.name, email: u.email }])
      );
    }

    const result = rows.map((l) => ({
      ...l,
      user: l.user_id ? userMap[l.user_id] ?? null : null,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
