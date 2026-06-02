import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, getCurrentUserRole, requirePermission } from "@/lib/supabase-server";
import { resolveExpenseApprover } from "@/lib/expense-approver";
import { createNotification } from "@/lib/notify";
import type { TablesUpdate } from "@/lib/database.types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requirePermission("expenses:edit");
    if (denied) return denied;

    const { id } = await params;
    const me = await getCurrentUserRole();
    if (!me) return NextResponse.json({ error: "未認証" }, { status: 401 });

    const supabase = await createClient();
    const company_id = await getCompanyId();

    const { data: existing } = await supabase
      .from("expenses")
      .select("status, amount, owner_amount, property_id, description")
      .eq("id", id)
      .eq("company_id", company_id)
      .single();
    if (!existing) return NextResponse.json({ error: "経費が見つかりません" }, { status: 404 });
    if (existing.status !== "draft") {
      return NextResponse.json({ error: "下書きのみ提出できます" }, { status: 400 });
    }

    // しきい値判定
    const { data: company } = await supabase
      .from("companies")
      .select("expense_approval_threshold")
      .eq("id", company_id)
      .single();
    // threshold が NULL の会社は稟議機能OFF扱い（自動承認）
    const threshold =
      company?.expense_approval_threshold != null
        ? Number(company.expense_approval_threshold)
        : null;
    const requiresApproval =
      threshold !== null &&
      Number(existing.owner_amount) > 0 &&
      Number(existing.amount) >= threshold;

    let approverId: string | null = null;
    if (requiresApproval) {
      approverId = await resolveExpenseApprover(supabase, {
        company_id,
        property_id: existing.property_id,
      });
      if (!approverId) {
        return NextResponse.json(
          { error: "承認者が設定されていません。物件または会社設定で承認者を指定してください" },
          { status: 400 },
        );
      }
    }

    const nextStatus = requiresApproval ? "pending_approval" : "approved";
    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      status: nextStatus,
      submitted_by: me.user_id,
      submitted_at: now,
    };
    if (nextStatus === "approved") {
      update.approved_by = me.user_id;
      update.approved_at = now;
    }

    const { data, error } = await supabase
      .from("expenses")
      .update(update as TablesUpdate<"expenses">)
      .eq("id", id)
      .eq("company_id", company_id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: "提出に失敗しました" }, { status: 500 });

    // 承認者本人へベルマーク通知（自分が承認者を兼ねるときは出さない）
    if (requiresApproval && approverId && approverId !== me.user_id) {
      await createNotification({
        user_id: approverId,
        type: "warning",
        title: "経費の承認依頼",
        body: `${existing.description}（¥${Number(existing.amount).toLocaleString()}）の承認をお願いします`,
        link: `/expenses/${id}`,
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
