import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { calcPropertyManagementFee } from "@/lib/remittance-calc";

// GET: 送金額のプレビュー計算（DBには保存しない）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner_id = searchParams.get("owner_id");
    const month = searchParams.get("month"); // YYYY-MM-01形式

    if (!owner_id || !month) {
      return NextResponse.json(
        { error: "owner_id と month は必須です" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // オーナー情報取得
    const { data: owner } = await supabase
      .from("owners")
      .select("*")
      .eq("id", owner_id)
      .single();

    if (!owner) {
      return NextResponse.json(
        { error: "オーナーが見つかりません" },
        { status: 404 }
      );
    }

    // オーナーの物件・部屋を取得（手数料率は物件単位）
    const { data: properties } = await supabase
      .from("properties")
      .select("id, name, management_fee_type, management_fee_rate, management_fee_amount, management_form, units(id, unit_number, rent, management_fee, status)")
      .eq("owner_id", owner_id);

    // 当月のアクティブ契約の家賃請求を取得（入金済み分のみ）
    const monthStart = month; // YYYY-MM-01形式
    const { data: billings } = await supabase
      .from("rent_billings")
      .select("*, contract:contracts(unit_id)")
      .eq("billing_month", monthStart)
      .eq("status", "paid");

    // 当月の経費を取得（承認済みのみ、owner_amount で控除）
    const monthDate = new Date(monthStart);
    const nextMonth = new Date(monthDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const APPROVED_STATUSES = ["approved", "ordered", "completed", "paid"];
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*")
      .gt("owner_amount", 0)
      .eq("owner_id", owner_id)
      .in("status", APPROVED_STATUSES)
      .gte("expense_date", monthStart)
      .lt("expense_date", nextMonth.toISOString().slice(0, 10));

    // 物件ごとに手数料を計算して合算
    let totalRent = 0;
    let managementFeeDeducted = 0;
    const propertyBreakdown: { name: string; rent: number; fee: number }[] = [];

    for (const p of (properties ?? []) as Record<string, any>[]) {
      const pUnitIds = ((p.units as any[]) ?? []).map((u: any) => u.id);
      const pBillings = (billings ?? []).filter((b: any) => {
        const contract = b.contract as Record<string, unknown> | null;
        return contract && pUnitIds.includes(contract.unit_id);
      });
      const pRent = pBillings.reduce((s: number, b: any) => s + Number(b.total_amount), 0);
      const pFee = calcPropertyManagementFee({
        rent: pRent,
        feeType: p.management_fee_type,
        feeRate: p.management_fee_rate,
        feeAmount: p.management_fee_amount,
        managementForm: p.management_form,
      });
      totalRent += pRent;
      managementFeeDeducted += pFee;
      if (pRent > 0) {
        propertyBreakdown.push({ name: p.name, rent: pRent, fee: pFee });
      }
    }

    const expenseDeducted = (expenses ?? []).reduce(
      (s: number, e: Record<string, unknown>) => s + Number((e as { owner_amount: number }).owner_amount ?? 0),
      0
    );

    // 不足分（費用がオーナーの家賃収入を超過した分）は翌月繰越にせず、当月のオーナー請求とする。
    // 空室が続くと繰越では永遠に回収できないため。
    const provisional = totalRent - managementFeeDeducted - expenseDeducted;
    const netAmount = provisional >= 0 ? provisional : 0;
    // owner_bill_amount = オーナーへ請求する不足分。DB列は carryover_to_next を流用（意味は当月の請求額）。
    const ownerBillAmount = provisional >= 0 ? 0 : -provisional;

    return NextResponse.json({
      owner_id,
      remittance_month: monthStart,
      total_rent: totalRent,
      management_fee_deducted: managementFeeDeducted,
      expense_deducted: expenseDeducted,
      carryover_from_prev: 0,
      carryover_to_next: ownerBillAmount,
      owner_bill_amount: ownerBillAmount,
      net_amount: netAmount,
      property_breakdown: propertyBreakdown,
      expense_count: (expenses ?? []).length,
    });
  } catch {
    return NextResponse.json(
      { error: "計算処理に失敗しました" },
      { status: 500 }
    );
  }
}
