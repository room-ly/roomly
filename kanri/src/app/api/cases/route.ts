import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { caseSchema } from "@/lib/schemas";
import { createNotification } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = caseSchema.safeParse(body);

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
      property_id: parsed.data.property_id || null,
      unit_id: parsed.data.unit_id || null,
      reported_date: new Date().toISOString().slice(0, 10),
      company_id,
    };

    const { data: caseRow, error } = await supabase
      .from("cases")
      .insert(data)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "対応案件の作成に失敗しました" },
        { status: 500 }
      );
    }

    const priority = parsed.data.priority ?? "normal";
    const typeMap: Record<string, "info" | "warning" | "danger"> = {
      urgent: "danger", high: "warning", normal: "info", low: "info",
    };
    await createNotification({
      title: `対応案件: ${parsed.data.title}`,
      type: typeMap[priority] ?? "info",
      link: `/cases/${caseRow.id}`,
    });

    return NextResponse.json(caseRow, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
