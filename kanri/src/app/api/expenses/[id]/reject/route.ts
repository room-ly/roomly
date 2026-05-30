import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, getCurrentUserRole, requirePermission } from "@/lib/supabase-server";
import { expenseRejectSchema } from "@/lib/schemas-expense";
import { resolveExpenseApprover } from "@/lib/expense-approver";
import { createNotification } from "@/lib/notify";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requirePermission("expenses:approve");
    if (denied) return denied;

    const { id } = await params;
    const me = await getCurrentUserRole();
    if (!me) return NextResponse.json({ error: "未認証" }, { status: 401 });
    const body = await request.json();
    const parsed = expenseRejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "却下理由が必要です", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const supabase = await createClient();
    const company_id = await getCompanyId();

    const { data: existing } = await supabase
      .from("expenses")
      .select("status, property_id, description, amount, submitted_by")
      .eq("id", id)
      .eq("company_id", company_id)
      .single();
    if (!existing) return NextResponse.json({ error: "経費が見つかりません" }, { status: 404 });
    if (existing.status !== "pending_approval") {
      return NextResponse.json(
        { error: "承認待ち状態の経費のみ却下できます" },
        { status: 400 },
      );
    }

    const approverId = await resolveExpenseApprover(supabase, {
      company_id,
      property_id: existing.property_id,
    });
    if (approverId !== me.user_id) {
      return NextResponse.json(
        { error: "この経費の承認者ではありません" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("expenses")
      .update({
        status: "rejected",
        approved_by: me.user_id,
        approved_at: new Date().toISOString(),
        rejected_reason: parsed.data.rejected_reason,
      })
      .eq("id", id)
      .eq("company_id", company_id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: "却下に失敗しました" }, { status: 500 });

    // 提出者本人へ却下通知
    if (existing.submitted_by && existing.submitted_by !== me.user_id) {
      await createNotification({
        user_id: existing.submitted_by,
        type: "danger",
        title: "経費が却下されました",
        body: `${existing.description}（¥${Number(existing.amount).toLocaleString()}）が却下されました。理由: ${parsed.data.rejected_reason}`,
        link: `/expenses/${id}`,
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
