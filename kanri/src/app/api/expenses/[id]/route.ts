import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { expenseSchema } from "@/lib/schemas-expense";
import { saveExpense, IMMUTABLE_EXPENSE_STATUSES } from "@/lib/expense-service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = expenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const companyId = await getCompanyId();
    const { data: { user } } = await supabase.auth.getUser();

    // 既存レコードの status を確認。承認以降は編集禁止
    const { data: existing } = await supabase
      .from("expenses")
      .select("status")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();
    if (!existing) {
      return NextResponse.json({ error: "経費が見つかりません" }, { status: 404 });
    }
    if (IMMUTABLE_EXPENSE_STATUSES.includes(existing.status as never)) {
      return NextResponse.json(
        { error: "承認済みの経費は編集できません" },
        { status: 403 },
      );
    }

    const result = await saveExpense(supabase, {
      id,
      input: parsed.data,
      company_id: companyId,
      user_id: user?.id ?? null,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.expense);
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const companyId = await getCompanyId();

    const { data: existing } = await supabase
      .from("expenses")
      .select("status")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();
    if (!existing) {
      return NextResponse.json({ error: "経費が見つかりません" }, { status: 404 });
    }
    if (IMMUTABLE_EXPENSE_STATUSES.includes(existing.status as never)) {
      return NextResponse.json(
        { error: "承認済みの経費は削除できません" },
        { status: 403 },
      );
    }

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) {
      return NextResponse.json({ error: "経費の削除に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
