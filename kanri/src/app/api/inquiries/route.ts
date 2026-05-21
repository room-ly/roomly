import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, checkDemoLimit, DemoLimitError } from "@/lib/supabase-server";
import { inquirySchema } from "@/lib/schemas";
import { createNotification } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);

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
      tenant_id: parsed.data.tenant_id || null,
      company_id,
    };

    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .insert(data)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "問い合わせの作成に失敗しました" },
        { status: 500 }
      );
    }

    const typeMap: Record<string, "info" | "warning" | "danger"> = {
      complaint: "danger", urgent: "danger", normal: "info",
    };
    await createNotification({
      title: `問い合わせ: ${parsed.data.title}`,
      type: typeMap[parsed.data.inquiry_type ?? ""] ?? "info",
      link: `/inquiries/${inquiry.id}`,
    });

    return NextResponse.json(inquiry, { status: 201 });
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
