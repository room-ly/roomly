import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";

const DEFAULT_CHECKLIST = [
  { category: "notice", item_name: "退去日確定", sort_order: 0 },
  { category: "notice", item_name: "退去届受領", sort_order: 1 },
  { category: "notice", item_name: "保証会社へ連絡", sort_order: 2 },
  { category: "inspection", item_name: "退去立会い日程調整", sort_order: 3 },
  { category: "inspection", item_name: "退去立会い実施", sort_order: 4 },
  { category: "inspection", item_name: "原状回復範囲確認", sort_order: 5 },
  { category: "restoration", item_name: "原状回復工事手配", sort_order: 6 },
  { category: "restoration", item_name: "原状回復工事完了", sort_order: 7 },
  { category: "settlement", item_name: "敷金精算書作成", sort_order: 8 },
  { category: "settlement", item_name: "敷金返還完了", sort_order: 9 },
  { category: "settlement", item_name: "鍵回収", sort_order: 10 },
  { category: "settlement", item_name: "最終家賃精算", sort_order: 11 },
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("move_out_checklist_items")
      .select("*")
      .eq("contract_id", id)
      .order("sort_order");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const companyId = await getCompanyId();

    const { count } = await supabase
      .from("move_out_checklist_items")
      .select("id", { count: "exact", head: true })
      .eq("contract_id", id);

    if (count && count > 0) {
      return NextResponse.json({ error: "チェックリストは既に作成されています" }, { status: 409 });
    }

    const items = DEFAULT_CHECKLIST.map((item) => ({
      ...item,
      company_id: companyId,
      contract_id: id,
    }));

    const { error } = await supabase.from("move_out_checklist_items").insert(items);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, count: items.length });
  } catch {
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params;
    const supabase = await createClient();
    const body = await request.json();
    const { item_id, is_checked, notes } = body;

    if (!item_id) {
      return NextResponse.json({ error: "item_id が必要です" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (typeof is_checked === "boolean") {
      updates.is_checked = is_checked;
      updates.checked_at = is_checked ? new Date().toISOString() : null;
    }
    if (typeof notes === "string") {
      updates.notes = notes;
    }

    const { error } = await supabase
      .from("move_out_checklist_items")
      .update(updates)
      .eq("id", item_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
