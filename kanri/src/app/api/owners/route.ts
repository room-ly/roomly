import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, checkDemoLimit, DemoLimitError } from "@/lib/supabase-server";
import { ownerSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ownerSchema.safeParse(body);

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
      company_id,
    };

    const { data: owner, error } = await supabase
      .from("owners")
      .insert(data)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "オーナーの作成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(owner, { status: 201 });
  } catch (err) {
    if (err instanceof DemoLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
