import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { gatherAndBuildRemittance } from "@/lib/remittance-data";
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
    const company_id = await getCompanyId();

    // 送金計算（calc プレビューと同一ロジック。実入金ベース・外税・未精算経費）
    const built = await gatherAndBuildRemittance(supabase, {
      ownerId: owner_id,
      month: remittance_month,
      manualNetAmount: manual_net_amount,
    });
    if (!built.ok) {
      return NextResponse.json({ error: built.error }, { status: built.status });
    }
    const r = built.data;

    // 重複送金チェック（DB側 UNIQUE 制約と二重で守る）
    const { data: existing } = await supabase
      .from("owner_remittances")
      .select("id")
      .eq("company_id", company_id)
      .eq("owner_id", owner_id)
      .eq("remittance_month", remittance_month)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "この月の送金は既に作成されています" },
        { status: 409 }
      );
    }

    const payment_method = reqPaymentMethod || "transfer";

    const { data: remittance, error: remError } = await supabase
      .from("owner_remittances")
      .insert({
        owner_id,
        remittance_month,
        total_rent: r.totalRent,
        management_fee_deducted: r.managementFeeDeducted,
        management_fee_tax: r.managementFeeTax,
        expense_deducted: r.expenseDeducted,
        owner_bill_amount: r.ownerBillAmount,
        net_amount: r.netAmount,
        status: "draft",
        payment_method,
        manual_override: r.isManual,
        manual_net_amount: r.isManual ? Number(manual_net_amount) : null,
        company_id,
      } as TablesInsert<"owner_remittances">)
      .select()
      .single();

    if (remError || !remittance) {
      // UNIQUE 制約違反は重複として 409 を返す
      if (remError?.code === "23505") {
        return NextResponse.json(
          { error: "この月の送金は既に作成されています" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "送金明細の作成に失敗しました" },
        { status: 500 }
      );
    }

    // 明細行を保存
    if (r.items.length > 0) {
      const itemRows: TablesInsert<"owner_remittance_items">[] = r.items.map((it) => ({
        company_id,
        remittance_id: remittance.id,
        unit_id: it.unit_id,
        item_type: it.item_type,
        description: it.description,
        amount: it.amount,
      }));
      const { error: itemError } = await supabase
        .from("owner_remittance_items")
        .insert(itemRows);
      if (itemError) {
        // 整合性のため送金を削除してロールバック（best-effort）
        await supabase.from("owner_remittances").delete().eq("id", remittance.id);
        return NextResponse.json(
          { error: "送金明細の保存に失敗しました" },
          { status: 500 }
        );
      }
    }

    // 精算した経費に remittance_id を紐付け
    if (r.settledExpenseIds.length > 0) {
      const { error: expError } = await supabase
        .from("expenses")
        .update({ remittance_id: remittance.id })
        .in("id", r.settledExpenseIds);
      if (expError) {
        // 経費紐付け失敗時も整合性のため送金を削除（明細は FK ON DELETE で消える）
        await supabase.from("owner_remittances").delete().eq("id", remittance.id);
        return NextResponse.json(
          { error: "経費の精算紐付けに失敗しました" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(remittance, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
