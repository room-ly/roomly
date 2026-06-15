import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase-server";

// Roomly運営者のみアクセス可能。ROOMLY_ADMIN_EMAILSに含まれるemailのみ許可
function isRoomlyAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ROOMLY_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isRoomlyAdmin(user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // plan=free で絞るか全件か（デフォルト: デモ以外の全件）
  const planFilter = request.nextUrl.searchParams.get("plan"); // "free" | null
  const admin = getAdmin();

  let query = admin
    .from("v_company_activity")
    .select("*")
    .eq("is_demo", false);

  if (planFilter === "free") {
    query = query.eq("plan", "free");
  }

  // 稼働順（直近7日 → 累計）に並べる
  const { data, error } = await query
    .order("ops_7d", { ascending: false })
    .order("ops_total", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data });
}
