import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { rentBillingSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
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
    const { data: billing, error } = await supabase
      .from("rent_billings")
      .insert({
        ...parsed.data,
        contract_id,
        rent: rent ?? 0,
        management_fee: management_fee ?? 0,
        company_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "家賃請求の作成に失敗しました", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(billing, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
