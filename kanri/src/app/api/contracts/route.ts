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
    const data = {
      ...parsed.data,
      end_date: parsed.data.end_date || null,
      company_id,
    };

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

    // 契約がactiveの場合、当月分の家賃請求を自動生成（後処理：失敗しても契約自体は成功）
    if (contract.status === "active") {
      try {
        const startDate = new Date(contract.start_date);
        const billingMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-01`;

        // 翌月末日を計算
        const nextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 2, 0);
        const dueDate = nextMonth.toISOString().slice(0, 10);

        const totalAmount = Number(contract.rent) + Number(contract.management_fee);

        await supabase.from("rent_billings").insert({
          contract_id: contract.id,
          billing_month: billingMonth,
          total_amount: totalAmount,
          due_date: dueDate,
          status: "unpaid",
          company_id,
        });
      } catch {
        // 家賃請求の自動生成失敗は無視（契約作成は成功扱い）
      }
    }

    return NextResponse.json(contract, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
