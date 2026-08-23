// 複数オーナーの送金明細をまとめて作成・確定する処理。
// 単体生成（POST /api/remittances）と同じ計算・保存手順をループ適用する。
import type { SupabaseClient } from "@supabase/supabase-js";
import { gatherAndBuildRemittance } from "./remittance-data";
import { planBulkGeneration, type BulkTarget } from "./bulk-remittance";
import type { TablesInsert } from "./database.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, "public", any>;

export interface ConfirmResult {
  remittance_ids: string[]; // confirmed になった送金ID
  generated: number;        // 新規作成した件数
  skipped: number;          // 既存draftを再利用した件数
  failed: { owner_id: string; owner_name: string; reason: string }[];
}

// 対象オーナーの送金明細を作成し、confirmed まで進める。
// 1件失敗しても他は続行する（締め作業が1オーナーの不備で止まらないように）。
export async function confirmOwnersForMonth(
  supabase: Client,
  params: {
    company_id: string;
    remittance_month: string; // YYYY-MM-01
    targets: BulkTarget[];
  }
): Promise<ConfirmResult> {
  const { company_id, remittance_month, targets } = params;
  const plan = planBulkGeneration(targets);

  const remittance_ids: string[] = [];
  const failed: ConfirmResult["failed"] = [];
  let generated = 0;
  let skipped = 0;

  for (const step of plan) {
    const c = step.target;
    try {
      let remittanceId: string | null = null;

      if (step.kind === "reuse") {
        // 既に draft がある場合は再生成せず確定のみ
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
          // UNIQUE制約違反＝競合して既に作成済み。エラーではなくスキップ扱い。
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

      if (!remittanceId) continue; // 到達しない想定（型の絞り込み用）

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
      remittance_ids.push(remittanceId);
    } catch {
      failed.push({
        owner_id: c.owner_id,
        owner_name: c.owner_name,
        reason: "予期しないエラーが発生しました",
      });
    }
  }

  return { remittance_ids, generated, skipped, failed };
}
