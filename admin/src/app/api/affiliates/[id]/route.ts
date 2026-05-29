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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoomlyAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = getAdmin();

  const [affiliateRes, conversionsRes, clicksRes, companiesRes] =
    await Promise.all([
      admin.from("affiliates").select("*").eq("id", id).maybeSingle(),
      admin
        .from("affiliate_conversions")
        .select("*")
        .eq("affiliate_id", id)
        .order("occurred_at", { ascending: false })
        .limit(200),
      admin
        .from("affiliate_clicks")
        .select("clicked_at, landing_path, referrer, utm_source")
        .eq("affiliate_id", id)
        .order("clicked_at", { ascending: false })
        .limit(50),
      admin
        .from("companies")
        .select(
          "id, name, subscription_status, subscription_started_at, plan, max_units, created_at"
        )
        .eq("affiliate_id", id)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  if (affiliateRes.error) {
    return NextResponse.json(
      { error: affiliateRes.error.message },
      { status: 500 }
    );
  }
  if (!affiliateRes.data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    affiliate: affiliateRes.data,
    conversions: conversionsRes.data ?? [],
    clicks: clicksRes.data ?? [],
    companies: companiesRes.data ?? [],
  });
}

// 承認・拒否・編集
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRoomlyAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const admin = getAdmin();
  const update: Record<string, unknown> = {};

  if (typeof body.status === "string") {
    const allowed = ["pending", "active", "suspended", "rejected"];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: "invalid status" },
        { status: 400 }
      );
    }
    update.status = body.status;
    if (body.status === "active") {
      update.approved_at = new Date().toISOString();
      update.approved_by = auth.userId;
    }
    if (body.status === "rejected") {
      update.rejected_at = new Date().toISOString();
      update.rejected_reason =
        typeof body.rejected_reason === "string"
          ? body.rejected_reason
          : null;
    }
  }

  const editableFields = [
    "name",
    "email",
    "phone",
    "prospect_type",
    "website_url",
    "social_url",
    "notes",
    "commission_initial_jpy",
    "commission_recurring_rate",
    "commission_recurring_months",
    "bank_name",
    "bank_branch",
    "bank_account_type",
    "bank_account_number",
    "bank_account_holder",
    "invoice_registration_number",
  ];
  for (const f of editableFields) {
    if (body[f] !== undefined) {
      update[f] = body[f];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const { error } = await admin
    .from("affiliates")
    .update(update)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // active化したタイミングで、まだ affiliate_id 紐付けされていない過去の
  // companies (affiliate_code 一致) を紐付ける
  if (update.status === "active") {
    const { data: affiliate } = await admin
      .from("affiliates")
      .select("code")
      .eq("id", id)
      .maybeSingle();
    if (affiliate?.code) {
      await admin
        .from("companies")
        .update({ affiliate_id: id })
        .eq("affiliate_code", affiliate.code)
        .is("affiliate_id", null);
    }
  }

  return NextResponse.json({ ok: true });
}
