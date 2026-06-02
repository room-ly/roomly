import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { rentPaymentSchema } from "@/lib/schemas";
import { createNotification } from "@/lib/notify";
import type { TablesUpdate } from "@/lib/database.types";

// 入金登録（部分入金対応）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("rent:edit");
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json();

    // 入金登録の場合
    if (body.action === "payment") {
      const parsed = rentPaymentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const supabase = await createClient();

      // 現在の請求情報を取得
      const company_id = await getCompanyId();
      const { data: billing, error: fetchError } = await supabase
        .from("rent_billings")
        .select("*, rent_payments(amount)")
        .eq("id", id)
        .eq("company_id", company_id)
        .single();

      if (fetchError || !billing) {
        return NextResponse.json(
          { error: "請求情報が見つかりません" },
          { status: 404 }
        );
      }

      // 対象外（フリーレント・入居前後等）の月には入金登録できない
      if (billing.status === "exempt") {
        return NextResponse.json(
          { error: "対象外の月には入金を登録できません。先に対象外を解除してください。" },
          { status: 400 }
        );
      }

      // 既存の入金合計を計算
      const existingPayments = (billing.rent_payments || []).reduce(
        (sum: number, p: { amount: number }) => sum + Number(p.amount),
        0
      );
      const isRefund = parsed.data.payment_method === "refund";
      const recordAmount = isRefund ? -parsed.data.amount : parsed.data.amount;
      const newTotal = existingPayments + recordAmount;
      const totalAmount = Number(billing.total_amount);

      const { error: paymentError } = await supabase
        .from("rent_payments")
        .insert({
          billing_id: id,
          amount: recordAmount,
          payment_method: parsed.data.payment_method,
          payment_date: parsed.data.payment_date,
          notes: parsed.data.note || (isRefund ? "返金" : null),
          company_id,
        });

      if (paymentError) {
        return NextResponse.json(
          { error: isRefund ? "返金の登録に失敗しました" : "入金の登録に失敗しました" },
          { status: 500 }
        );
      }

      // 請求ステータスを更新
      const newStatus = newTotal >= totalAmount ? "paid" : newTotal > 0 ? "partial" : "unpaid";
      const { error: updateError } = await supabase
        .from("rent_billings")
        .update({ status: newStatus })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: "ステータスの更新に失敗しました" },
          { status: 500 }
        );
      }

      if (newStatus === "paid" && !isRefund) {
        await createNotification({
          title: `入金完了: ${billing.billing_month}`,
          type: "info",
          link: `/rent/${id}`,
        });
      }

      return NextResponse.json({
        success: true,
        status: newStatus,
        paid_total: newTotal,
        remaining: Math.max(0, totalAmount - newTotal),
      });
    }

    // 通常の更新
    const ALLOWED_BILLING_FIELDS = ["status", "due_date", "billing_month", "total_amount", "other_amount", "other_description"] as const;
    const updateData: Record<string, unknown> = {};
    for (const key of ALLOWED_BILLING_FIELDS) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const supabase = await createClient();
    const companyId = await getCompanyId();
    const { data: updated, error } = await supabase
      .from("rent_billings")
      .update(updateData as TablesUpdate<"rent_billings">)
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "家賃請求の更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
