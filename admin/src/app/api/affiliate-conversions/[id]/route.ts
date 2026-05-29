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

  const status = typeof body.status === "string" ? body.status : null;
  if (!status || !["approved", "rejected", "clawback"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const admin = getAdmin();
  const update: Record<string, unknown> = { status };
  if (status === "approved") {
    update.approved_at = new Date().toISOString();
    update.approved_by = auth.userId;
  }
  if (typeof body.notes === "string") {
    update.notes = body.notes;
  }
  if (typeof body.amount_jpy === "number") {
    update.amount_jpy = body.amount_jpy;
  }

  const { error } = await admin
    .from("affiliate_conversions")
    .update(update)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
