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

const VIEWS = [
  "v_login_daily",
  "v_login_by_geo",
  "v_login_by_source",
  "v_signup_funnel",
  "v_signup_attribution",
  "v_signup_by_geo",
] as const;
type ViewName = (typeof VIEWS)[number];

export async function GET(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isRoomlyAdmin(user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const view = request.nextUrl.searchParams.get("view") as ViewName | null;
  if (!view || !VIEWS.includes(view)) {
    return NextResponse.json({ error: "invalid view" }, { status: 400 });
  }

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "100", 10), 1000);
  const admin = getAdmin();

  // ビューはservice_roleでのみ読める（生データテーブルがservice_role限定のため）
  const { data, error } = await admin.from(view).select("*").limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data });
}
