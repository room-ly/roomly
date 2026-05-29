import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRoomlyAdmin } from "@/lib/admin-auth";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const auth = await requireRoomlyAdmin();
  if (!auth.ok) return auth.response;

  const admin = getAdmin();

  // 集計はservice_role でcount + 個別取得
  const [
    pendingAffRes,
    activeAffRes,
    pendingConvRes,
    approvedConvRes,
    totalCompaniesRes,
  ] = await Promise.all([
    admin
      .from("affiliates")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("affiliates")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("affiliate_conversions")
      .select("amount_jpy", { count: "exact" })
      .eq("status", "pending"),
    admin
      .from("affiliate_conversions")
      .select("amount_jpy", { count: "exact" })
      .eq("status", "approved"),
    admin
      .from("companies")
      .select("*", { count: "exact", head: true })
      .not("affiliate_id", "is", null),
  ]);

  const sum = (rows: { amount_jpy: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + (r.amount_jpy ?? 0), 0);

  return NextResponse.json({
    pending_affiliates: pendingAffRes.count ?? 0,
    active_affiliates: activeAffRes.count ?? 0,
    pending_conversions_count: pendingConvRes.count ?? 0,
    pending_conversions_amount_jpy: sum(pendingConvRes.data ?? null),
    approved_conversions_count: approvedConvRes.count ?? 0,
    approved_conversions_amount_jpy: sum(approvedConvRes.data ?? null),
    total_referred_companies: totalCompaniesRes.count ?? 0,
  });
}
