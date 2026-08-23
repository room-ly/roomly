import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { getUnconfirmedOwnerCandidates } from "@/lib/payment-batch-service";
import { confirmOwnersForMonth } from "@/lib/bulk-remittance-service";
import { createNotification } from "@/lib/notify";
import { buildBulkNotificationTitle } from "@/lib/bulk-remittance";

// POST: 対象月の全オーナーの送金明細を一括生成・確定する。
// 通常は振込データ作成（/api/payment-batches/prepare）に内包されるが、
// 確定だけを先に済ませたい場合のためにエンドポイントとして残している。
export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("remittances:create");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const { remittance_month } = body as { remittance_month?: string };

    if (!remittance_month || !/^\d{4}-\d{2}-01$/.test(remittance_month)) {
      return NextResponse.json(
        { error: "remittance_monthはYYYY-MM-01形式で指定してください" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();

    const { candidates } = await getUnconfirmedOwnerCandidates(
      supabase,
      company_id,
      remittance_month
    );

    if (candidates.length === 0) {
      return NextResponse.json({
        generated: 0,
        confirmed: 0,
        skipped: 0,
        failed: [],
        message: "生成対象のオーナーがいません",
      });
    }

    const result = await confirmOwnersForMonth(supabase, {
      company_id,
      remittance_month,
      targets: candidates,
    });

    await createNotification({
      title: buildBulkNotificationTitle(remittance_month, {
        generated: result.generated,
        confirmed: result.remittance_ids.length,
        skipped: result.skipped,
        failed: result.failed,
      }),
      type: result.failed.length > 0 ? "warning" : "info",
      link: "/payments",
    });

    return NextResponse.json({
      generated: result.generated,
      confirmed: result.remittance_ids.length,
      skipped: result.skipped,
      failed: result.failed,
    });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
