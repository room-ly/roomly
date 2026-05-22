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
    const { move_out_date, ...inquiryFields } = parsed.data;
    const data = {
      ...inquiryFields,
      property_id: inquiryFields.property_id || null,
      unit_id: inquiryFields.unit_id || null,
      tenant_id: inquiryFields.tenant_id || null,
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

    let linked_maintenance_id: string | null = null;
    let linked_move_out_request_id: string | null = null;

    // 修繕種別: 修繕依頼を自動作成
    if (parsed.data.inquiry_type === "maintenance" && data.property_id) {
      const { data: maintenance } = await supabase
        .from("maintenance_requests")
        .insert({
          company_id,
          property_id: data.property_id,
          unit_id: data.unit_id || null,
          tenant_id: data.tenant_id || null,
          title: parsed.data.title,
          description: parsed.data.description || null,
          category: "other",
          priority: parsed.data.priority ?? "normal",
          reported_date: new Date().toISOString().slice(0, 10),
        })
        .select("id")
        .single();

      if (maintenance) {
        linked_maintenance_id = maintenance.id;
        await (supabase.from("inquiries") as any)
          .update({ linked_maintenance_id: maintenance.id })
          .eq("id", inquiry.id);
      }
    }

    // 退去種別: move_out_requestを自動作成
    if (parsed.data.inquiry_type === "move_out" && data.unit_id && move_out_date) {
      // 部屋の有効契約を検索
      const { data: contract } = await supabase
        .from("contracts")
        .select("id, tenant_id")
        .eq("unit_id", data.unit_id)
        .eq("company_id", company_id)
        .eq("status", "active")
        .limit(1)
        .single();

      if (contract) {
        const tenantId = data.tenant_id || contract.tenant_id;
        const { data: moveOutReq } = await supabase
          .from("move_out_requests")
          .insert({
            company_id,
            contract_id: contract.id,
            tenant_id: tenantId,
            desired_move_out_date: move_out_date,
            reason: parsed.data.description || null,
          })
          .select("id")
          .single();

        if (moveOutReq) {
          linked_move_out_request_id = moveOutReq.id;
          await (supabase.from("inquiries") as any)
            .update({ linked_move_out_request_id: moveOutReq.id })
            .eq("id", inquiry.id);
        }
      }
    }

    const typeMap: Record<string, "info" | "warning" | "danger"> = {
      complaint: "danger", maintenance: "warning",
    };
    await createNotification({
      title: `問い合わせ: ${parsed.data.title}`,
      type: typeMap[parsed.data.inquiry_type ?? ""] ?? "info",
      link: `/inquiries/${inquiry.id}`,
    });

    return NextResponse.json(
      { ...inquiry, linked_maintenance_id, linked_move_out_request_id },
      { status: 201 }
    );
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
