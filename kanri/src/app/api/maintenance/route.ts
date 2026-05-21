import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, checkDemoLimit, DemoLimitError } from "@/lib/supabase-server";
import { maintenanceSchema } from "@/lib/schemas";
import { createNotification } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = maintenanceSchema.safeParse(body);

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
      unit_id: parsed.data.unit_id || null,
      reported_date: new Date().toISOString().slice(0, 10),
      company_id,
    };

    const { data: maintenance, error } = await supabase
      .from("maintenance_requests")
      .insert(data)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "修繕依頼の作成に失敗しました" },
        { status: 500 }
      );
    }

    const priority = parsed.data.priority ?? "normal";
    const typeMap: Record<string, "info" | "warning" | "danger"> = {
      urgent: "danger", high: "warning", normal: "info", low: "info",
    };
    await createNotification({
      title: `修繕依頼: ${parsed.data.title}`,
      type: typeMap[priority] ?? "info",
      link: `/maintenance/${maintenance.id}`,
    });

    return NextResponse.json(maintenance, { status: 201 });
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
