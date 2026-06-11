import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";

// GET: 振込バッチ詳細（明細付き）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requirePermission("remittances:read");
    if (denied) return denied;

    const { id } = await params;
    const supabase = await createClient();
    const company_id = await getCompanyId();

    const { data: batch, error } = await supabase
      .from("payment_batches")
      .select("*, items:payment_batch_items(*), sender:company_bank_accounts(label, bank_name, branch_name, account_type, account_number, account_holder)")
      .eq("id", id)
      .eq("company_id", company_id)
      .single();
    if (error || !batch) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

    return NextResponse.json(batch);
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

// DELETE: draft バッチを削除（明細は CASCADE。対象の送金/費用は候補に戻る）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requirePermission("remittances:delete");
    if (denied) return denied;

    const { id } = await params;
    const supabase = await createClient();
    const company_id = await getCompanyId();

    const { data: existing } = await supabase
      .from("payment_batches")
      .select("status")
      .eq("id", id)
      .eq("company_id", company_id)
      .single();
    if (!existing) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    if (existing.status === "executed") {
      return NextResponse.json({ error: "実行済みの振込バッチは削除できません" }, { status: 403 });
    }

    const { error } = await supabase
      .from("payment_batches")
      .delete()
      .eq("id", id)
      .eq("company_id", company_id);
    if (error) return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
