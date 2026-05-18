import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";

const ALLOWED_FIELDS = [
  "title", "description", "category", "priority", "status",
  "property_id", "unit_id", "vendor_name", "vendor_phone",
  "estimated_cost", "actual_cost", "completed_date",
] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const supabase = await createClient();
    const companyId = await getCompanyId();
    const { data: maintenance, error } = await supabase
      .from("maintenance_requests")
      .update(updateData)
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "修繕依頼の更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(maintenance);
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
