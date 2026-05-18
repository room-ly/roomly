import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";

// GET: 送金一覧
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("owner_remittances")
      .select("*, owner:owners(name)")
      .order("remittance_month", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "送金データの取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 送金明細を生成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner_id, remittance_month, payment_method: reqPaymentMethod, manual_net_amount } = body;

    if (!owner_id || !remittance_month) {
      return NextResponse.json(
        { error: "オーナーIDと対象月は必須です" },
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
      .select("id, name, management_fee_rate, units(id, unit_number, rent, management_fee, status)")
      .eq("owner_id", owner_id);

    // 当月のアクティブ契約の家賃請求を取得（入金済み分のみ）
    const monthStart = remittance_month; // YYYY-MM-01形式
    const { data: billings } = await supabase
      .from("rent_billings")
      .select("*, contract:contracts(unit_id)")
      .eq("billing_month", monthStart)
      .eq("status", "paid");

    // 当月のオーナー負担経費を取得
    const monthDate = new Date(monthStart);
    const nextMonth = new Date(monthDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*")
      .eq("is_owner_charge", true)
      .eq("owner_id", owner_id)
      .gte("expense_date", monthStart)
      .lt("expense_date", nextMonth.toISOString().slice(0, 10));

    // 物件ごとに手数料を計算して合算
    let totalRent = 0;
    let managementFeeDeducted = 0;

    for (const p of (properties ?? []) as Record<string, any>[]) {
      const pUnitIds = ((p.units as any[]) ?? []).map((u: any) => u.id);
      const pBillings = (billings ?? []).filter((b: any) => {
        const contract = b.contract as Record<string, unknown> | null;
        return contract && pUnitIds.includes(contract.unit_id);
      });
      const pRent = pBillings.reduce((s: number, b: any) => s + Number(b.total_amount), 0);
      const pFeeRate = Number(p.management_fee_rate) || 0;
      totalRent += pRent;
      managementFeeDeducted += Math.round(pRent * (pFeeRate / 100));
    }

    const expenseDeducted = (expenses ?? []).reduce(
      (s: number, e: Record<string, unknown>) => s + Number(e.amount),
      0
    );
    const netAmount = totalRent - managementFeeDeducted - expenseDeducted;

    const company_id = await getCompanyId();
    const payment_method = reqPaymentMethod || "transfer";
    const isManual = manual_net_amount !== undefined && manual_net_amount !== null;

    const { data: remittance, error: remError } = await supabase
      .from("owner_remittances")
      .insert({
        owner_id,
        remittance_month: monthStart,
        total_rent: totalRent,
        management_fee_deducted: managementFeeDeducted,
        expense_deducted: expenseDeducted,
        net_amount: isManual ? Number(manual_net_amount) : netAmount,
        status: "draft",
        payment_method,
        manual_override: isManual,
        manual_net_amount: isManual ? Number(manual_net_amount) : null,
        company_id,
      })
      .select()
      .single();

    if (remError) {
      return NextResponse.json(
        { error: "送金明細の作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(remittance, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
