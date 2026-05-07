import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { rentPaymentSchema } from "@/lib/schemas";

// 入金登録（部分入金対応）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      const { data: billing, error: fetchError } = await supabase
        .from("rent_billings")
        .select("*, rent_payments(amount)")
        .eq("id", id)
        .single();

      if (fetchError || !billing) {
        return NextResponse.json(
          { error: "請求情報が見つかりません" },
          { status: 404 }
        );
      }

      // 既存の入金合計を計算
      const existingPayments = (billing.rent_payments || []).reduce(
        (sum: number, p: { amount: number }) => sum + Number(p.amount),
        0
      );
      const newTotal = existingPayments + parsed.data.amount;
      const totalAmount = Number(billing.total_amount);

      const company_id = await getCompanyId();
      const { error: paymentError } = await supabase
        .from("rent_payments")
        .insert({
          rent_billing_id: id,
          amount: parsed.data.amount,
          payment_method: parsed.data.payment_method,
          payment_date: parsed.data.payment_date,
          note: parsed.data.note || null,
          company_id,
        });

      if (paymentError) {
        return NextResponse.json(
          { error: "入金の登録に失敗しました", details: paymentError.message },
          { status: 500 }
        );
      }

      // 請求ステータスを更新
      const newStatus = newTotal >= totalAmount ? "paid" : "partial";
      const { error: updateError } = await supabase
        .from("rent_billings")
        .update({ status: newStatus })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: "ステータスの更新に失敗しました", details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        status: newStatus,
        paid_total: newTotal,
        remaining: Math.max(0, totalAmount - newTotal),
      });
    }

    // 通常の更新
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("rent_billings")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "家賃請求の更新に失敗しました", details: error.message },
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
