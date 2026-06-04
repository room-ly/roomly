import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getCompanyId, getCurrentUserRole } from "@/lib/supabase-server";

const schema = z.object({
  amount: z.coerce.number().int().positive(),
  due_date: z.string().min(1),
  billing_month: z.string().min(1),
  description: z.string().optional().nullable(),
});

/**
 * 敷金不足分を入居者に追加請求する。
 *   1. rent_billings に other_amount で1件追加
 *   2. deposit_transactions に transaction_type='additional_billing' で1件追加
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: expenseId } = await params;
    const me = await getCurrentUserRole();
    if (!me) return NextResponse.json({ error: "未認証" }, { status: 401 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();

    const { data: expense } = await supabase
      .from("expenses")
      .select("id, contract_id, description")
      .eq("id", expenseId)
      .eq("company_id", company_id)
      .single();
    if (!expense?.contract_id) {
      return NextResponse.json(
        { error: "費用に紐づく契約がありません" },
        { status: 400 },
      );
    }

    const desc =
      parsed.data.description ?? `敷金不足分の追加請求 (${expense.description})`;

    const { data: billing, error: billingErr } = await supabase
      .from("rent_billings")
      .insert({
        company_id,
        contract_id: expense.contract_id,
        billing_month: parsed.data.billing_month,
        rent: 0,
        management_fee: 0,
        other_amount: parsed.data.amount,
        other_description: desc,
        total_amount: parsed.data.amount,
        due_date: parsed.data.due_date,
        status: "unpaid",
      })
      .select()
      .single();
    if (billingErr) {
      return NextResponse.json({ error: "請求作成に失敗しました" }, { status: 500 });
    }

    const { error: depErr } = await supabase.from("deposit_transactions").insert({
      company_id,
      contract_id: expense.contract_id,
      expense_id: expenseId,
      billing_id: billing.id,
      amount: parsed.data.amount,
      transaction_type: "additional_billing",
      occurred_at: parsed.data.billing_month,
      notes: desc,
      created_by: me.user_id,
    });
    if (depErr) {
      // billing は残す（手動で削除可能）。エラーは返さず警告に留める
    }

    return NextResponse.json({ billing }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
