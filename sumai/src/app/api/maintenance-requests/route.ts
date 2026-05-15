import { NextRequest, NextResponse } from "next/server";
import { createClient, getTenantId, getCompanyId } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const tenantId = await getTenantId();
    const companyId = await getCompanyId();
    if (!tenantId || !companyId) {
      return NextResponse.json({ error: "認証エラー" }, { status: 401 });
    }
    const body = await request.json();

    if (!body.contract_id || !body.title) {
      return NextResponse.json(
        { error: "件名は必須です" },
        { status: 400 }
      );
    }

    // 契約から物件・部屋情報を取得
    const { data: contract } = await supabase
      .from("contracts")
      .select("id, tenant_id, unit_id, unit:units(property_id)")
      .eq("id", body.contract_id)
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .single();

    if (!contract) {
      return NextResponse.json(
        { error: "対象の契約が見つかりません" },
        { status: 404 }
      );
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const unit = contract.unit as any;

    const { data, error } = await supabase
      .from("maintenance_requests")
      .insert({
        company_id: companyId,
        property_id: unit?.property_id,
        unit_id: contract.unit_id,
        tenant_id: tenantId,
        title: body.title,
        description: body.description || null,
        category: body.category || "other",
        priority: "normal",
        status: "open",
        reported_date: new Date().toISOString().slice(0, 10),
        source: "tenant_app",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
