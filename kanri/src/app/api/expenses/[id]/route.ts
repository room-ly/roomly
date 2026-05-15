import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { expenseSchema } from "@/lib/schemas-expense";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = expenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const data = {
      ...parsed.data,
      property_id: parsed.data.property_id || null,
      unit_id: parsed.data.unit_id || null,
      owner_id: parsed.data.owner_id || null,
    };

    const { data: expense, error } = await supabase
      .from("expenses")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "経費の更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(expense);
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
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "経費の削除に失敗しました" },
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
