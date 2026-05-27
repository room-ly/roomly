import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { expenseSchema } from "@/lib/schemas-expense";
import { saveExpense } from "@/lib/expense-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = expenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();
    const { data: { user } } = await supabase.auth.getUser();

    const result = await saveExpense(supabase, {
      input: parsed.data,
      company_id,
      user_id: user?.id ?? null,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
