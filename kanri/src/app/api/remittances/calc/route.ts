import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { gatherAndBuildRemittance } from "@/lib/remittance-data";

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
    const built = await gatherAndBuildRemittance(supabase, {
      ownerId: owner_id,
      month,
    });

    if (!built.ok) {
      return NextResponse.json({ error: built.error }, { status: built.status });
    }

    const r = built.data;

    // 物件別の家賃・手数料内訳（プレビュー表示用）
    const propertyBreakdown = built.raw.properties
      .map((p) => {
        const rent = r.items
          .filter((it) => it.item_type === "rent" && p.units.some((u) => u.id === it.unit_id))
          .reduce((s, it) => s + it.amount, 0);
        const fee = -r.items
          .filter((it) => it.item_type === "management_fee" && it.description.includes(p.name))
          .reduce((s, it) => s + it.amount, 0);
        return { name: p.name, rent, fee };
      })
      .filter((b) => b.rent > 0);

    return NextResponse.json({
      owner_id,
      remittance_month: month,
      total_rent: r.totalRent,
      management_fee_deducted: r.managementFeeDeducted,
      management_fee_tax: r.managementFeeTax,
      expense_deducted: r.expenseDeducted,
      owner_bill_amount: r.ownerBillAmount,
      net_amount: r.netAmount,
      property_breakdown: propertyBreakdown,
      expense_count: built.raw.expenses.length,
    });
  } catch {
    return NextResponse.json(
      { error: "計算処理に失敗しました" },
      { status: 500 }
    );
  }
}
