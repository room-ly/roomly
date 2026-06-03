import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { SYSTEM_USER_ID, SYSTEM_USER_DISPLAY, isSystemUserId } from "@/lib/system-user";
import { refTableForColumn } from "@/lib/audit-field-labels";

// 参照先テーブルごとの「表示名の引き方」。
// select に渡すカラムと、行 → 表示名 への整形関数を定義する。
const REF_RESOLVERS: Record<
  string,
  { select: string; toName: (row: Record<string, unknown>) => string }
> = {
  properties: { select: "id, name", toName: (r) => String(r.name ?? "") },
  units: { select: "id, unit_number", toName: (r) => (r.unit_number ? `${r.unit_number}号室` : "") },
  tenants: { select: "id, name", toName: (r) => String(r.name ?? "") },
  payees: { select: "id, name", toName: (r) => String(r.name ?? "") },
  owners: { select: "id, name", toName: (r) => String(r.name ?? "") },
  contracts: {
    select: "id, tenant:tenants(name), unit:units(unit_number)",
    toName: (r) => {
      const tenant = (r.tenant as { name?: string } | null)?.name;
      const unit = (r.unit as { unit_number?: string } | null)?.unit_number;
      if (tenant && unit) return `${tenant}（${unit}号室）`;
      return tenant || (unit ? `${unit}号室` : "契約");
    },
  },
  cases: { select: "id, title", toName: (r) => String(r.title ?? "") },
  rent_billings: { select: "id, billing_month", toName: (r) => r.billing_month ? `${String(r.billing_month).slice(0, 7)} 請求` : "請求" },
  loans: { select: "id, name", toName: (r) => String(r.name ?? "") },
};

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

    // user_idを name に解決（同じ会社の users から）。SYSTEM_USER_ID は users JOIN せず「システム」として返す
    // 操作者(user_id) に加え、before/after_values の users 参照カラム（承認者・申請者等）も解決対象に含める
    const userIdSet = new Set<string>();
    for (const l of rows) {
      if (l.user_id && !isSystemUserId(l.user_id)) userIdSet.add(l.user_id);
      for (const vals of [l.before_values, l.after_values]) {
        if (!vals) continue;
        for (const [col, v] of Object.entries(vals)) {
          if (refTableForColumn(col) === "users" && typeof v === "string" && v && !isSystemUserId(v)) {
            userIdSet.add(v);
          }
        }
      }
    }
    const userIds = Array.from(userIdSet);
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
    userMap[SYSTEM_USER_ID] = { ...SYSTEM_USER_DISPLAY };

    // before/after_values に含まれる ID 参照カラムの UUID を表示名に解決する。
    // 参照先テーブルごとに UUID を集約 → 一括取得 → { uuid: 表示名 } マップを作る。
    const idsByTable: Record<string, Set<string>> = {};
    for (const l of rows) {
      for (const vals of [l.before_values, l.after_values]) {
        if (!vals) continue;
        for (const [col, v] of Object.entries(vals)) {
          const refTable = refTableForColumn(col);
          if (!refTable || typeof v !== "string" || !v) continue;
          // users は userMap で別途解決済みなのでスキップ
          if (refTable === "users") continue;
          (idsByTable[refTable] ??= new Set()).add(v);
        }
      }
    }

    const refNames: Record<string, string> = {};
    await Promise.all(
      Object.entries(idsByTable).map(async ([refTable, idSet]) => {
        const resolver = REF_RESOLVERS[refTable];
        if (!resolver) return;
        // database.types.ts に無いテーブルも動的に叩くため from を any キャスト（既存の audit_logs 取得と同様）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: refRows } = await (supabase.from as any)(refTable)
          .select(resolver.select)
          .in("id", Array.from(idSet));
        for (const r of (refRows ?? []) as Record<string, unknown>[]) {
          const name = resolver.toName(r);
          if (r.id && name) refNames[String(r.id)] = name;
        }
      })
    );

    // users 参照カラム（approver_user_id 等）は userMap から refNames に合流させる
    for (const l of rows) {
      for (const vals of [l.before_values, l.after_values]) {
        if (!vals) continue;
        for (const [col, v] of Object.entries(vals)) {
          if (refTableForColumn(col) === "users" && typeof v === "string" && userMap[v]) {
            refNames[v] = userMap[v].name;
          }
        }
      }
    }

    const result = rows.map((l) => ({
      ...l,
      user: l.user_id ? userMap[l.user_id] ?? null : null,
    }));

    return NextResponse.json({ logs: result, refNames });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
