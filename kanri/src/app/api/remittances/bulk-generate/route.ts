import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { getUnconfirmedOwnerCandidates } from "@/lib/payment-batch-service";
import { gatherAndBuildRemittance } from "@/lib/remittance-data";
import { createNotification } from "@/lib/notify";
import { planBulkGeneration, buildBulkNotificationTitle } from "@/lib/bulk-remittance";
import type { TablesInsert } from "@/lib/database.types";

// POST: 対象月の全オーナーの送金明細を一括生成する。
// 単体生成（POST /api/remittances）と同じ計算・保存ロジックを、
// 候補オーナー分ループして適用する。既に送金がある月はスキップする。
export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("remittances:create");
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const { remittance_month, confirm } = body as {
      remittance_month?: string;
      confirm?: boolean;
    };

    if (!remittance_month || !/^\d{4}-\d{2}-01$/.test(remittance_month)) {
      return NextResponse.json(
        { error: "remittance_monthはYYYY-MM-01形式で指定してください" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();

    // 対象月の未確定オーナー候補（送金額>0・確定済みは除外済み）
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

    let generated = 0;
    let confirmedCount = 0;
    let skipped = 0;
    const failed: { owner_id: string; owner_name: string; reason: string }[] = [];

    // 新規作成 / 既存draft再利用に振り分ける（判定は bulk-remittance.ts の純粋関数）
    const plan = planBulkGeneration(candidates);

    // オーナー単位で逐次処理する。1件失敗しても他は続行し、結果をまとめて返す。
    for (const step of plan) {
      const c = step.target;
      try {
        let remittanceId: string | null = null;

        // 既に draft がある場合は再生成せず、確定処理のみ行う
        if (step.kind === "reuse") {
          remittanceId = step.remittance_id;
          skipped += 1;
        } else {
          const built = await gatherAndBuildRemittance(supabase, {
            ownerId: c.owner_id,
            month: remittance_month,
          });
          if (!built.ok) {
            failed.push({ owner_id: c.owner_id, owner_name: c.owner_name, reason: built.error });
            continue;
          }
          const r = built.data;

          const { data: remittance, error: remError } = await supabase
            .from("owner_remittances")
            .insert({
              owner_id: c.owner_id,
              remittance_month,
              total_rent: r.totalRent,
              management_fee_deducted: r.managementFeeDeducted,
              management_fee_tax: r.managementFeeTax,
              expense_deducted: r.expenseDeducted,
              owner_bill_amount: r.ownerBillAmount,
              net_amount: r.netAmount,
              status: "draft",
              payment_method: "transfer",
              manual_override: false,
              manual_net_amount: null,
              company_id,
            } as TablesInsert<"owner_remittances">)
            .select()
            .single();

          if (remError || !remittance) {
            // UNIQUE 制約違反＝他操作と競合して既に作成済み。エラーではなくスキップ扱い。
            if (remError?.code === "23505") {
              skipped += 1;
              continue;
            }
            failed.push({
              owner_id: c.owner_id,
              owner_name: c.owner_name,
              reason: "送金明細の作成に失敗しました",
            });
            continue;
          }

          // 明細行を保存（失敗時は送金を削除してロールバック）
          if (r.items.length > 0) {
            const itemRows: TablesInsert<"owner_remittance_items">[] = r.items.map((it) => ({
              company_id,
              remittance_id: remittance.id,
              unit_id: it.unit_id,
              item_type: it.item_type,
              description: it.description,
              amount: it.amount,
            }));
            const { error: itemError } = await supabase
              .from("owner_remittance_items")
              .insert(itemRows);
            if (itemError) {
              await supabase.from("owner_remittances").delete().eq("id", remittance.id);
              failed.push({
                owner_id: c.owner_id,
                owner_name: c.owner_name,
                reason: "送金明細の保存に失敗しました",
              });
              continue;
            }
          }

          // 精算した経費に remittance_id を紐付け（失敗時はロールバック）
          if (r.settledExpenseIds.length > 0) {
            const { error: expError } = await supabase
              .from("expenses")
              .update({ remittance_id: remittance.id })
              .in("id", r.settledExpenseIds);
            if (expError) {
              await supabase.from("owner_remittances").delete().eq("id", remittance.id);
              failed.push({
                owner_id: c.owner_id,
                owner_name: c.owner_name,
                reason: "経費の精算紐付けに失敗しました",
              });
              continue;
            }
          }

          remittanceId = remittance.id;
          generated += 1;
        }

        // confirm 指定時は draft をそのまま確定まで進める
        if (confirm && remittanceId) {
          const { error: confError } = await supabase
            .from("owner_remittances")
            .update({ status: "confirmed" })
            .eq("id", remittanceId)
            .eq("company_id", company_id);
          if (confError) {
            failed.push({
              owner_id: c.owner_id,
              owner_name: c.owner_name,
              reason: "精算の確定に失敗しました",
            });
            continue;
          }
          confirmedCount += 1;
        }
      } catch {
        failed.push({
          owner_id: c.owner_id,
          owner_name: c.owner_name,
          reason: "予期しないエラーが発生しました",
        });
      }
    }

    await createNotification({
      title: buildBulkNotificationTitle(remittance_month, {
        generated,
        confirmed: confirmedCount,
        skipped,
        failed,
      }),
      type: failed.length > 0 ? "warning" : "info",
      link: "/payments",
    });

    return NextResponse.json({
      generated,
      confirmed: confirmedCount,
      skipped,
      failed,
    });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
