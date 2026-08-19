import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { stripPhone } from "@/lib/phone";
import type { TablesUpdate } from "@/lib/database.types";

export async function PUT(request: NextRequest) {
  try {
    const denied = await requirePermission("settings:edit");
    if (denied) return denied;

    const body = await request.json();
    const supabase = await createClient();
    const companyId = await getCompanyId();

    const allowed = ["name", "phone", "address", "postal_code", "usage_type", "contract_alert_days", "estate_license", "estate_agent_name", "estate_agent_license", "default_approver_user_id", "expense_approval_threshold", "loan_feature_enabled", "seal_column_enabled"];
    const update: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    if (update.phone !== undefined) {
      update.phone = stripPhone(update.phone);
    }
    if (update.contract_alert_days !== undefined) {
      update.contract_alert_days = Number(update.contract_alert_days);
    }
    if (update.default_approver_user_id !== undefined) {
      update.default_approver_user_id = update.default_approver_user_id || null;
    }
    if (update.loan_feature_enabled !== undefined) {
      update.loan_feature_enabled = Boolean(update.loan_feature_enabled);
    }
    if (update.seal_column_enabled !== undefined) {
      update.seal_column_enabled = Boolean(update.seal_column_enabled);
    }
    if (update.expense_approval_threshold !== undefined) {
      // null/空文字/0は「稟議機能OFF」を意味するため null として保存
      const v = update.expense_approval_threshold;
      if (v === null || v === "" || Number(v) <= 0) {
        update.expense_approval_threshold = null;
      } else {
        update.expense_approval_threshold = Number(v);
      }
    }

    const { error } = await supabase
      .from("companies")
      .update(update as TablesUpdate<"companies">)
      .eq("id", companyId);

    if (error) {
      return NextResponse.json(
        { error: "設定の保存に失敗しました" },
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
