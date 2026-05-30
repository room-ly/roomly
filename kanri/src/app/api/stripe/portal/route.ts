import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getCompanyId, requirePermission } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("settings:edit");
    if (denied) return denied;

    const companyId = await getCompanyId();
    const admin = getAdmin();
    const { data: company } = await admin
      .from("companies")
      .select("stripe_customer_id")
      .eq("id", companyId)
      .single();

    if (!company?.stripe_customer_id) {
      return NextResponse.json(
        { error: "サブスクリプションが見つかりません" },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3001";

    const session = await getStripe().billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "ポータルの作成に失敗しました" },
      { status: 500 }
    );
  }
}
