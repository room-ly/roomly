import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRoomlyAdmin } from "@/lib/admin-auth";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireRoomlyAdmin();
  if (!auth.ok) return auth.response;

  const status = request.nextUrl.searchParams.get("status");

  const admin = getAdmin();
  let query = admin
    .from("affiliate_conversions")
    .select(
      "id, affiliate_id, company_id, conversion_type, amount_jpy, mrr_at_conversion_jpy, recurring_month_index, status, occurred_at, notes, affiliates(name, email, code), companies(name)"
    )
    .order("occurred_at", { ascending: false })
    .limit(200);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data });
}
