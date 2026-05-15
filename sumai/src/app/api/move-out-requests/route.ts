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

    if (!body.contract_id || !body.desired_move_out_date) {
      return NextResponse.json(
        { error: "退去希望日は必須です" },
        { status: 400 }
      );
    }

    // 契約の所有権確認
    const { data: contract } = await supabase
      .from("contracts")
      .select("id, tenant_id, status")
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

    // 既存の未完了申請チェック
    const { data: existing } = await supabase
      .from("move_out_requests")
      .select("id")
      .eq("contract_id", body.contract_id)
      .in("status", ["pending", "approved"])
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "既に退去申請が提出されています" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("move_out_requests")
      .insert({
        company_id: companyId,
        contract_id: body.contract_id,
        tenant_id: tenantId,
        desired_move_out_date: body.desired_move_out_date,
        reason: body.reason || null,
        forwarding_postal_code: body.forwarding_postal_code || null,
        forwarding_address: body.forwarding_address || null,
        forwarding_phone: body.forwarding_phone || null,
        bank_name: body.bank_name || null,
        bank_branch: body.bank_branch || null,
        bank_account_type: body.bank_account_type || "普通",
        bank_account_number: body.bank_account_number || null,
        bank_account_holder: body.bank_account_holder || null,
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

export async function GET() {
  try {
    const supabase = await createClient();
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "認証エラー" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("move_out_requests")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
