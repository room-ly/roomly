import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { createNotification } from "@/lib/notify";
import { effectiveTerms } from "@/lib/billing-status";

// 翌月末日を計算する
function getNextMonthEnd(billingMonth: string): string {
  const date = new Date(billingMonth);
  // 2ヶ月先の1日の前日 = 翌月末日
  date.setMonth(date.getMonth() + 2, 0);
  return date.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("rent:create");
    if (denied) return denied;

    const body = await request.json();
    const { billing_month } = body;

    // billing_monthのバリデーション（YYYY-MM-01形式）
    if (
      !billing_month ||
      !/^\d{4}-\d{2}-01$/.test(billing_month)
    ) {
      return NextResponse.json(
        { error: "billing_monthはYYYY-MM-01形式で指定してください" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();

    // 1. active契約を全件取得（rent, management_fee付き）
    const { data: contracts, error: contractError } = await supabase
      .from("contracts")
      .select("id, rent, management_fee, end_date, renewal_effective_date, renewal_rent, renewal_management_fee, renewal_end_date")
      .eq("status", "active")
      .eq("company_id", company_id);

    if (contractError) {
      return NextResponse.json(
        { error: `契約の取得に失敗しました: ${contractError.message}` },
        { status: 500 }
      );
    }

    if (!contracts || contracts.length === 0) {
      return NextResponse.json(
        { generated: 0, skipped: 0, message: "有効な契約がありません" },
        { status: 200 }
      );
    }

    // 2. 同月の既存rent_billingsを取得して除外対象を特定
    const contractIds = contracts.map((c) => c.id);
    const { data: existingBillings, error: billingError } = await supabase
      .from("rent_billings")
      .select("contract_id")
      .eq("billing_month", billing_month)
      .in("contract_id", contractIds);

    if (billingError) {
      return NextResponse.json(
        { error: `既存請求の確認に失敗しました: ${billingError.message}` },
        { status: 500 }
      );
    }

    const existingContractIds = new Set(
      (existingBillings || []).map((b) => b.contract_id)
    );

    // 3. 未生成分を抽出
    const toInsert = contracts
      .filter((c) => !existingContractIds.has(c.id))
      .map((c) => {
        // billing_month 時点で有効な賃料・管理費（更新発効日以降は更新後の値）
        const { rent, management_fee } = effectiveTerms(c, billing_month);
        return {
          contract_id: c.id,
          billing_month,
          rent,
          management_fee,
          total_amount: rent + management_fee,
          due_date: getNextMonthEnd(billing_month),
          status: "unpaid" as const,
          company_id,
        };
      });

    const skipped = contracts.length - toInsert.length;

    if (toInsert.length === 0) {
      return NextResponse.json({
        generated: 0,
        skipped,
        message: "全ての契約で既に請求が存在します",
      });
    }

    // 4. 一括INSERT
    const { error: insertError } = await supabase
      .from("rent_billings")
      .insert(toInsert);

    if (insertError) {
      return NextResponse.json(
        { error: `請求の一括作成に失敗しました: ${insertError.message}` },
        { status: 500 }
      );
    }

    // 通知
    await createNotification({
      title: `家賃一括請求: ${billing_month.slice(0, 7)}分 ${toInsert.length}件生成`,
      type: "info",
      link: "/rent",
    });

    return NextResponse.json({
      generated: toInsert.length,
      skipped,
    });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
