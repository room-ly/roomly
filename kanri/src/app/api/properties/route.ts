import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { propertySchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("properties:create");
    if (denied) return denied;

    const body = await request.json();
    const parsed = propertySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();
    const data = {
      ...parsed.data,
      owner_id: parsed.data.owner_id || null,
      approver_user_id: parsed.data.approver_user_id || null,
      company_id,
    };

    const { data: property, error } = await supabase
      .from("properties")
      .insert(data)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "物件の作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(property, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
