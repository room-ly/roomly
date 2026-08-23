import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { createPaymentBatch, getUnconfirmedOwnerCandidates } from "@/lib/payment-batch-service";
import { confirmOwnersForMonth } from "@/lib/bulk-remittance-service";

// POST: 未確定オーナーの精算確定 → 振込バッチ作成 を1リクエストで行う。
// 「確定」はCSVを出すための前準備でしかなく、利用者が個別に押す意味がないため、
// 振込データ作成の一部として内部で自動的に済ませる。
export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("remittances:create");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const {
      remittance_month,
      batch_date,
      sender_account_id,
      notes,
      owner_ids,
      remittance_ids,
      expense_ids,
    } = body as {
      remittance_month?: string;
      batch_date?: string;
      sender_account_id?: string | null;
      notes?: string | null;
      owner_ids?: string[];        // 未確定のまま選択されたオーナー
      remittance_ids?: string[];   // 確定済みで選択された送金
      expense_ids?: string[];      // 業者への費用支払い
    };

    if (!remittance_month || !/^\d{4}-\d{2}-01$/.test(remittance_month)) {
      return NextResponse.json(
        { error: "remittance_monthはYYYY-MM-01形式で指定してください" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. 未確定オーナーを確定する（選択されたオーナーのみ）
    const selectedOwnerIds = new Set(Array.isArray(owner_ids) ? owner_ids : []);
    let confirmedIds: string[] = [];
    let failed: { owner_id: string; owner_name: string; reason: string }[] = [];

    if (selectedOwnerIds.size > 0) {
      const { candidates } = await getUnconfirmedOwnerCandidates(
        supabase,
        company_id,
        remittance_month
      );
      const targets = candidates.filter((c) => selectedOwnerIds.has(c.owner_id));
      const result = await confirmOwnersForMonth(supabase, {
        company_id,
        remittance_month,
        targets,
      });
      confirmedIds = result.remittance_ids;
      failed = result.failed;
    }

    // 2. 確定済み送金 + 今confirmedにした分 + 費用でバッチを作る
    const allRemittanceIds = [
      ...(Array.isArray(remittance_ids) ? remittance_ids : []),
      ...confirmedIds,
    ];

    if (allRemittanceIds.length === 0 && (!expense_ids || expense_ids.length === 0)) {
      return NextResponse.json(
        {
          error:
            failed.length > 0
              ? "選択したオーナーの精算確定に失敗したため、振込データを作成できませんでした"
              : "振込対象が選択されていません",
          failed,
        },
        { status: 400 }
      );
    }

    const result = await createPaymentBatch(supabase, {
      company_id,
      user_id: user?.id ?? null,
      batch_date: String(batch_date ?? ""),
      sender_account_id: sender_account_id ?? null,
      notes: notes ?? null,
      remittance_ids: allRemittanceIds,
      expense_ids: Array.isArray(expense_ids) ? expense_ids : [],
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error, failed }, { status: result.status });
    }

    return NextResponse.json({ batch: result.batch, confirmed: confirmedIds.length, failed }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
