import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { createPaymentBatch } from "@/lib/payment-batch-service";

// GET: 振込バッチ一覧
export async function GET() {
  try {
    const denied = await requirePermission("remittances:read");
    if (denied) return denied;

    const supabase = await createClient();
    const company_id = await getCompanyId();

    const { data, error } = await supabase
      .from("payment_batches")
      .select("id, batch_date, status, total_amount, notes, executed_at, created_at")
      .eq("company_id", company_id)
      .order("batch_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

// POST: 振込バッチ作成（remittance_ids + expense_ids から明細を生成）
export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("remittances:create");
    if (denied) return denied;

    const body = await request.json();
    const supabase = await createClient();
    const company_id = await getCompanyId();
    const { data: { user } } = await supabase.auth.getUser();

    const result = await createPaymentBatch(supabase, {
      company_id,
      user_id: user?.id ?? null,
      batch_date: String(body.batch_date ?? ""),
      sender_account_id: body.sender_account_id ?? null,
      notes: body.notes ?? null,
      remittance_ids: Array.isArray(body.remittance_ids) ? body.remittance_ids : [],
      expense_ids: Array.isArray(body.expense_ids) ? body.expense_ids : [],
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.batch, { status: 201 });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
