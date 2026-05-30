import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("company_bank_accounts")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at");

    if (error) {
      return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("settings:edit");
    if (denied) return denied;

    const body = await request.json();
    const { label, bank_name, bank_code, branch_name, branch_code, account_type, account_number, account_holder, is_default } = body;

    if (!label || !bank_name || !bank_code || !branch_name || !branch_code || !account_number || !account_holder) {
      return NextResponse.json({ error: "必須項目を入力してください" }, { status: 400 });
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();

    if (is_default) {
      await supabase
        .from("company_bank_accounts")
        .update({ is_default: false })
        .eq("company_id", company_id);
    }

    const { data, error } = await supabase
      .from("company_bank_accounts")
      .insert({
        company_id,
        label,
        bank_name,
        bank_code,
        branch_name,
        branch_code,
        account_type: account_type || "1",
        account_number,
        account_holder,
        is_default: is_default ?? false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await requirePermission("settings:edit");
    if (denied) return denied;

    const body = await request.json();
    const { id, label, bank_name, bank_code, branch_name, branch_code, account_type, account_number, account_holder, is_default } = body;

    if (!id) {
      return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
    }

    const supabase = await createClient();

    const company_id = await getCompanyId();
    if (is_default) {
      await supabase
        .from("company_bank_accounts")
        .update({ is_default: false })
        .eq("company_id", company_id);
    }

    const { data, error } = await supabase
      .from("company_bank_accounts")
      .update({
        label,
        bank_name,
        bank_code,
        branch_name,
        branch_code,
        account_type,
        account_number,
        account_holder,
        is_default,
      })
      .eq("id", id)
      .eq("company_id", company_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const denied = await requirePermission("settings:edit");
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();
    const { error } = await supabase
      .from("company_bank_accounts")
      .delete()
      .eq("id", id)
      .eq("company_id", company_id);

    if (error) {
      return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
