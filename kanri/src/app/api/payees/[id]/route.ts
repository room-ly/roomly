import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { payeeSchema } from "@/lib/schemas-payee";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("expenses:edit");
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json();
    const parsed = payeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const company_id = await getCompanyId();
    const { data, error } = await supabase
      .from("payees")
      .update(parsed.data)
      .eq("id", id)
      .eq("company_id", company_id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("expenses:delete");
    if (denied) return denied;

    const { id } = await params;
    const supabase = await createClient();
    const company_id = await getCompanyId();
    const { error } = await supabase
      .from("payees")
      .delete()
      .eq("id", id)
      .eq("company_id", company_id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
