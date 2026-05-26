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
      supabase.from("companies").select("plan, max_units, subscription_status, subscription_current_period_end").eq("id", company_id).single(),
      supabase.from("units").select("id", { count: "exact", head: true }),
    ]);
    const comp = companyRes.data;
    const isSubActive =
      comp?.subscription_status === "active" &&
      (!comp.subscription_current_period_end ||
        new Date(comp.subscription_current_period_end) > new Date());
    const effectiveMax = isSubActive ? (comp?.max_units ?? 50) : 10;
    const currentUnits = unitsRes.count ?? 0;
    if (currentUnits >= effectiveMax) {
      return NextResponse.json(
        { error: isSubActive
            ? "現在のプランの区画数上限に達しています。プランをアップグレードしてください。"
            : "フリープランの上限（10区画）に達しています。プロプランにアップグレードしてください。"
        },
        { status: 403 }
      );
    }

    // 同一物件内の部屋番号重複チェック
    const { data: dup } = await supabase
      .from("units")
      .select("id")
      .eq("property_id", property_id)
      .eq("unit_number", parsed.data.unit_number)
      .limit(1);
    if (dup && dup.length > 0) {
      return NextResponse.json(
        { error: `部屋番号「${parsed.data.unit_number}」は既にこの物件に存在します` },
        { status: 409 }
      );
    }

    const { data: unit, error } = await supabase
      .from("units")
      .insert({ ...parsed.data, property_id, company_id })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "部屋の作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(unit, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
