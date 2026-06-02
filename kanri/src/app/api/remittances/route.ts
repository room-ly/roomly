import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { calcPropertyManagementFee } from "@/lib/remittance-calc";
import type { TablesInsert } from "@/lib/database.types";

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
    const denied = await requirePermission("remittances:create");
    if (denied) return denied;

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
      .select("id, name, management_fee_type, management_fee_rate, management_fee_amount, management_form, units(id, unit_number, rent, management_fee, status)")
      .eq("owner_id", owner_id);

    // 当月のアクティブ契約の家賃請求を取得（入金済み分のみ）
    const monthStart = remittance_month; // YYYY-MM-01形式
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
      .select("*, allocations:expense_allocations(owner_amount, owner_id, unit_id, unit:units(property_id))")
      .gt("owner_amount", 0)
      .eq("owner_id", owner_id)
      .in("status", APPROVED_STATUSES)
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
      const pFee = calcPropertyManagementFee({
        rent: pRent,
        feeType: p.management_fee_type,
        feeRate: p.management_fee_rate,
        feeAmount: p.management_fee_amount,
        managementForm: p.management_form,
      });
      totalRent += pRent;
      managementFeeDeducted += pFee;
    }

    const expenseDeducted = (expenses ?? []).reduce(
      (s: number, e: Record<string, unknown>) => s + Number((e as { owner_amount: number }).owner_amount ?? 0),
      0
    );

    // 前月繰越（未収金）の取得
    const prevMonthDate = new Date(monthStart);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = prevMonthDate.toISOString().slice(0, 10);
    const { data: prevRem } = await supabase
      .from("owner_remittances")
      .select("carryover_to_next")
      .eq("owner_id", owner_id)
      .eq("remittance_month", prevMonth)
      .maybeSingle();
    const carryoverFromPrev = Number((prevRem as { carryover_to_next?: number } | null)?.carryover_to_next ?? 0);

    const provisional = totalRent - managementFeeDeducted - expenseDeducted - carryoverFromPrev;
    const autoNet = provisional >= 0 ? provisional : 0;
    // 手動指定がなければ、不足分を翌月繰越にする。
    // 手動指定がある場合は「実際に送金した額」が確定値となるので、
    // 自動計算で本来送るべきだった金額との差分を carryover_to_next に反映する。
    const company_id = await getCompanyId();
    const payment_method = reqPaymentMethod || "transfer";
    const isManual = manual_net_amount !== undefined && manual_net_amount !== null;
    const finalNet = isManual ? Math.max(0, Number(manual_net_amount)) : autoNet;
    // 自動計算ベースの理想送金額を基準に未収金を算出。手動で減らした分も繰越に積まれる。
    const idealNet = totalRent - managementFeeDeducted - expenseDeducted - carryoverFromPrev;
    const carryoverToNext = Math.max(0, -idealNet) + Math.max(0, idealNet - finalNet);

    const { data: remittance, error: remError } = await supabase
      .from("owner_remittances")
      .insert({
        owner_id,
        remittance_month: monthStart,
        total_rent: totalRent,
        management_fee_deducted: managementFeeDeducted,
        expense_deducted: expenseDeducted,
        carryover_from_prev: carryoverFromPrev,
        carryover_to_next: carryoverToNext,
        net_amount: finalNet,
        status: "draft",
        payment_method,
        manual_override: isManual,
        manual_net_amount: isManual ? Number(manual_net_amount) : null,
        company_id,
      } as TablesInsert<"owner_remittances">)
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
