import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/lib/database.types";

const ALLOWED_FIELDS = [
  "status", "notes", "payment_method",
  "total_rent", "management_fee_deducted", "expense_deducted",
  "net_amount", "manual_override", "manual_net_amount",
] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("remittances:edit");
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const companyId = await getCompanyId();

    const updateData: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }
    if (body.status === "sent" && !body.sent_date) {
      updateData.sent_date = new Date().toISOString().slice(0, 10);
    }

    const { data, error } = await supabase
      .from("owner_remittances")
      .update(updateData as TablesUpdate<"owner_remittances">)
      .eq("id", id)
      .eq("company_id", companyId)
      .select("*, owner:owners(name)")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "送金の更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("remittances:delete");
    if (denied) return denied;

    const { id } = await params;
    const supabase = await createClient();
    const companyId = await getCompanyId();
    const { error } = await supabase
      .from("owner_remittances")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) {
      return NextResponse.json(
        { error: "送金の削除に失敗しました" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
