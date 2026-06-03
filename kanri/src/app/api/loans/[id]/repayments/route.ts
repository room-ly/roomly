import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import type { TablesInsert, TablesUpdate } from "@/lib/database.types";

const ENTRY_TYPES = ["scheduled", "prepayment", "adjustment"];

function normalizeRow(r: Record<string, any>, company_id: string, loan_id: string): TablesInsert<"loan_repayments"> {
  return {
    company_id,
    loan_id,
    installment_no: r.installment_no != null && r.installment_no !== "" ? Number(r.installment_no) : null,
    payment_date: r.payment_date,
    principal_amount: r.principal_amount != null ? Number(r.principal_amount) : 0,
    interest_amount: r.interest_amount != null ? Number(r.interest_amount) : 0,
    balance_after: r.balance_after != null && r.balance_after !== "" ? Number(r.balance_after) : null,
    entry_type: ENTRY_TYPES.includes(r.entry_type) ? r.entry_type : "scheduled",
    source: r.source === "imported" ? "imported" : "manual",
    is_paid: Boolean(r.is_paid),
    paid_at: r.paid_at || null,
    notes: r.notes || null,
  };
}

// 返済行の追加（手動1行 or CSV一括）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requirePermission("loans:edit");
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const company_id = await getCompanyId();

    // CSV一括取込: { rows: [...], replace?: boolean }
    if (Array.isArray(body.rows)) {
      const validRows = body.rows.filter((r: any) => r.payment_date);
      if (validRows.length === 0) {
        return NextResponse.json({ error: "取込可能な行がありません（返済日が必須）" }, { status: 400 });
      }
      // CSV取込時は imported 扱いで既存の自動/取込行を置換するオプション
      if (body.replace) {
        await supabase
          .from("loan_repayments")
          .delete()
          .eq("loan_id", id)
          .eq("company_id", company_id)
          .neq("entry_type", "prepayment");
      }
      const insertRows = validRows.map((r: any) =>
        normalizeRow({ ...r, source: "imported" }, company_id, id),
      );
      const { error } = await supabase.from("loan_repayments").insert(insertRows);
      if (error) {
        return NextResponse.json({ error: "取込に失敗しました" }, { status: 500 });
      }
      return NextResponse.json({ count: insertRows.length }, { status: 201 });
    }

    // 単一行の手動追加
    if (!body.payment_date) {
      return NextResponse.json({ error: "返済日は必須です" }, { status: 400 });
    }
    const row = normalizeRow({ ...body, source: "manual" }, company_id, id);
    const { data, error } = await supabase.from("loan_repayments").insert(row).select().single();
    if (error) {
      return NextResponse.json({ error: "返済行の追加に失敗しました" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

// 返済行の更新（手動編集 / 入金済みトグル）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requirePermission("loans:edit");
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.repayment_id) {
      return NextResponse.json({ error: "repayment_id が必要です" }, { status: 400 });
    }
    const supabase = await createClient();
    const company_id = await getCompanyId();

    const update: Record<string, any> = {};
    for (const k of ["installment_no", "payment_date", "principal_amount", "interest_amount",
      "balance_after", "entry_type", "is_paid", "paid_at", "notes"]) {
      if (k in body) update[k] = body[k];
    }
    // 手動編集された行は source を manual に倒す（自動生成と区別）
    update.source = "manual";
    for (const k of ["installment_no", "principal_amount", "interest_amount", "balance_after"]) {
      if (k in update && update[k] !== null && update[k] !== "") update[k] = Number(update[k]);
      if (update[k] === "") update[k] = null;
    }

    const { data, error } = await supabase
      .from("loan_repayments")
      .update(update as TablesUpdate<"loan_repayments">)
      .eq("id", body.repayment_id)
      .eq("loan_id", id)
      .eq("company_id", company_id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: "返済行の更新に失敗しました" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

// 返済行の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requirePermission("loans:edit");
  if (denied) return denied;
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const repaymentId = searchParams.get("repayment_id");
    if (!repaymentId) {
      return NextResponse.json({ error: "repayment_id が必要です" }, { status: 400 });
    }
    const supabase = await createClient();
    const company_id = await getCompanyId();
    const { error } = await supabase
      .from("loan_repayments")
      .delete()
      .eq("id", repaymentId)
      .eq("loan_id", id)
      .eq("company_id", company_id);
    if (error) {
      return NextResponse.json({ error: "返済行の削除に失敗しました" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
