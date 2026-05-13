import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const companyId = await getCompanyId();

    const allowed = ["name", "phone", "email", "address", "usage_type", "contract_alert_days"];
    const update: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    if (update.contract_alert_days !== undefined) {
      update.contract_alert_days = Number(update.contract_alert_days);
    }

    const { error } = await supabase
      .from("companies")
      .update(update)
      .eq("id", companyId);

    if (error) {
      return NextResponse.json(
        { error: "設定の保存に失敗しました", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
