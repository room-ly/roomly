import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { unitSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { property_id, ...rest } = body;

    if (!property_id) {
      return NextResponse.json(
        { error: "物件IDが必要です" },
        { status: 400 }
      );
    }

    const parsed = unitSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();

    const [companyRes, unitsRes] = await Promise.all([
      supabase.from("companies").select("plan, max_units").single(),
      supabase.from("units").select("id", { count: "exact", head: true }),
    ]);
    const maxUnits = companyRes.data?.max_units ?? 10;
    const currentUnits = unitsRes.count ?? 0;
    if (currentUnits >= maxUnits) {
      return NextResponse.json(
        { error: "区画数の上限に達しています。プロプランにアップグレードしてください。" },
        { status: 403 }
      );
    }

    const { data: unit, error } = await supabase
      .from("units")
      .insert({ ...parsed.data, property_id, company_id })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "部屋の作成に失敗しました", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(unit, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
