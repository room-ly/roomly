import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { unitSchema } from "@/lib/schemas";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("units:edit");
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json();
    const parsed = unitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const companyId = await getCompanyId();
    const { data: unit, error } = await supabase
      .from("units")
      .update(parsed.data)
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "部屋の更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(unit);
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
    const denied = await requirePermission("units:delete");
    if (denied) return denied;

    const { id } = await params;
    const supabase = await createClient();
    const companyId = await getCompanyId();

    const { error } = await supabase
      .from("units")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) {
      return NextResponse.json(
        { error: "部屋の削除に失敗しました" },
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
