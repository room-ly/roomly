import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { rentBillingSchema } from "@/lib/schemas";
import { createNotification } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("rent:create");
    if (denied) return denied;

    const body = await request.json();
    const { contract_id, rent, management_fee, ...rest } = body;

    if (!contract_id) {
      return NextResponse.json(
        { error: "契約IDが必要です" },
        { status: 400 }
      );
    }

    const parsed = rentBillingSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();

    // rent / management_fee が明示されない場合は契約の実家賃を引き継ぐ。
    // ??0 で潰すと管理費0の請求が混入し、入金額と請求額が食い違う事故になる
    // （契約=実家賃が正。[[project_rent_asking_vs_contract]]）。
    let effectiveRent = rent;
    let effectiveManagementFee = management_fee;
    if (effectiveRent == null || effectiveManagementFee == null) {
      const { data: contract } = await supabase
        .from("contracts")
        .select("rent, management_fee")
        .eq("id", contract_id)
        .eq("company_id", company_id)
        .single();
      if (effectiveRent == null) effectiveRent = contract?.rent ?? 0;
      if (effectiveManagementFee == null) effectiveManagementFee = contract?.management_fee ?? 0;
    }

    // total_amount は内訳（賃料＋管理費＋その他）と一致させる。クライアントが送る
    // total_amount が管理費を含まないと、入金額と請求額が食い違う（今回の事故の本質）。
    // 内訳を正として total を再計算し、矛盾を構造的に防ぐ。
    const otherAmount = Number((parsed.data as { other_amount?: number }).other_amount ?? 0);
    const computedTotal = Number(effectiveRent) + Number(effectiveManagementFee) + otherAmount;

    const { data: billing, error } = await supabase
      .from("rent_billings")
      .insert({
        ...parsed.data,
        contract_id,
        rent: effectiveRent,
        management_fee: effectiveManagementFee,
        total_amount: computedTotal,
        company_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "家賃請求の作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(billing, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
