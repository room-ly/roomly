import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { ownerSchema } from "@/lib/schemas";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("owners:edit");
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json();
    const parsed = ownerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const companyId = await getCompanyId();

    const { data: owner, error } = await supabase
      .from("owners")
      .update(parsed.data)
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "オーナーの更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(owner);
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
    const denied = await requirePermission("owners:delete");
    if (denied) return denied;

    const { id } = await params;
    const supabase = await createClient();

    const companyId = await getCompanyId();
    const { error } = await supabase.from("owners").delete().eq("id", id).eq("company_id", companyId);

    if (error) {
      return NextResponse.json(
        { error: "オーナーの削除に失敗しました" },
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
