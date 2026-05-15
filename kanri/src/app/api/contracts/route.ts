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
        { error: "契約の作成に失敗しました", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(contract, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
