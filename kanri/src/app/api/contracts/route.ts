import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { contractSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contractSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();
    // date型カラムは空文字をnullに正規化する（""はPostgresのdate変換でエラーになる）
    const data = {
      ...parsed.data,
      end_date: parsed.data.end_date || null,
      move_out_date: parsed.data.move_out_date || null,
      signed_date: parsed.data.signed_date || null,
      important_explanation_date: parsed.data.important_explanation_date || null,
      company_id,
    };

    // 同一部屋にactive契約が既にある場合はエラー
    if (parsed.data.status === "active") {
      const { data: existing } = await supabase
        .from("contracts")
        .select("id")
        .eq("unit_id", parsed.data.unit_id)
        .eq("status", "active")
        .limit(1);
      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: "この部屋には既に有効な契約があります。既存の契約を終了してから作成してください。" },
          { status: 409 }
        );
      }
    }

    const { data: contract, error } = await supabase
      .from("contracts")
      .insert(data)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "契約の作成に失敗しました" },
        { status: 500 }
      );
    }

    // 契約がactiveの場合、当月分の家賃請求を自動生成
    if (contract.status === "active") {
      const startDate = new Date(contract.start_date);
      const billingMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-01`;
      const nextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 2, 0);
      const dueDate = nextMonth.toISOString().slice(0, 10);
      const totalAmount = Number(contract.rent) + Number(contract.management_fee);

      const { error: billingError } = await supabase.from("rent_billings").insert({
        contract_id: contract.id,
        billing_month: billingMonth,
        rent: Number(contract.rent),
        management_fee: Number(contract.management_fee),
        total_amount: totalAmount,
        due_date: dueDate,
        status: "unpaid",
        company_id,
      });
      if (billingError) {
        return NextResponse.json(
          { ...contract, _billing_warning: "契約は作成されましたが、初月の家賃請求の自動生成に失敗しました。家賃画面から手動で作成してください。" },
          { status: 201 }
        );
      }
    }

    return NextResponse.json(contract, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
