import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { executePaymentBatch } from "@/lib/payment-batch-service";

// POST: 振込バッチを「実行済み」に確定。オーナー送金=sent / 費用=paid_at を連動記録（冪等）
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requirePermission("remittances:edit");
    if (denied) return denied;

    const { id } = await params;
    const supabase = await createClient();
    const company_id = await getCompanyId();

    const result = await executePaymentBatch(supabase, company_id, id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
