import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { allocationPreviewSchema } from "@/lib/schemas-expense";
import { buildUnitAllocations } from "@/lib/expense-allocation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = allocationPreviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const supabase = await createClient();
    const company_id = await getCompanyId();

    const { data: units, error } = await supabase
      .from("units")
      .select("id, unit_number, area_sqm")
      .eq("property_id", parsed.data.property_id)
      .eq("company_id", company_id)
      .order("unit_number");
    if (error) {
      return NextResponse.json({ error: "部屋の取得に失敗しました" }, { status: 500 });
    }

    const drafts = buildUnitAllocations(
      (units ?? []).map((u) => ({
        id: u.id,
        unit_number: u.unit_number,
        area_sqm: u.area_sqm,
      })),
      {
        amount: parsed.data.amount,
        owner_amount: parsed.data.owner_amount,
        tenant_amount: parsed.data.tenant_amount,
        company_amount: parsed.data.company_amount,
      },
      parsed.data.method,
    );

    return NextResponse.json({ allocations: drafts });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
