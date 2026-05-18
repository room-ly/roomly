import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { expenseSchema } from "@/lib/schemas-expense";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = expenseSchema.safeParse(body);

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
      property_id: parsed.data.property_id || null,
      unit_id: parsed.data.unit_id || null,
      owner_id: parsed.data.owner_id || null,
      company_id,
    };

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert(data)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "経費の登録に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
