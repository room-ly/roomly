import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { generateSchedule, type RepaymentMethod } from "@/lib/loan-schedule";
import type { TablesInsert } from "@/lib/database.types";

// 借入条件から返済予定表を生成し、既存の予定行（scheduled）を置き換える。
// 手動追加した繰上返済（prepayment）等は残す。
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requirePermission("loans:edit");
  if (denied) return denied;
  try {
    const { id } = await params;
    const supabase = await createClient();
    const company_id = await getCompanyId();

    // ローンの借入条件を取得
    const { data: loan, error: loanErr } = await supabase
      .from("loans")
      .select("principal_amount, interest_rate, term_months, first_payment_date, repayment_method")
      .eq("id", id)
      .eq("company_id", company_id)
      .single();
    if (loanErr || !loan) {
      return NextResponse.json({ error: "ローンが見つかりません" }, { status: 404 });
    }
    if (!loan.term_months || !loan.first_payment_date) {
      return NextResponse.json(
        { error: "返済期間と初回返済日を設定すると予定表を自動生成できます" },
        { status: 400 },
      );
    }

    const rows = generateSchedule({
      principal: Number(loan.principal_amount),
      annualRatePercent: Number(loan.interest_rate ?? 0),
      termMonths: Number(loan.term_months),
      firstPaymentDate: loan.first_payment_date,
      method: (loan.repayment_method as RepaymentMethod) ?? "equal_principal_and_interest",
    });
    if (rows.length === 0) {
      return NextResponse.json({ error: "予定表の生成に失敗しました（借入条件を確認してください）" }, { status: 400 });
    }

    // 既存の自動生成行（scheduled）のみ削除して入れ替え。手動行は温存。
    await supabase
      .from("loan_repayments")
      .delete()
      .eq("loan_id", id)
      .eq("company_id", company_id)
      .eq("entry_type", "scheduled");

    const insertRows = rows.map((r) => ({
      company_id,
      loan_id: id,
      installment_no: r.installment_no,
      payment_date: r.payment_date,
      principal_amount: r.principal_amount,
      interest_amount: r.interest_amount,
      balance_after: r.balance_after,
      entry_type: "scheduled" as const,
      source: "imported" as const, // 自動生成は imported 扱い（手動編集で manual に変わる）
    }));
    const { error: insErr } = await supabase
      .from("loan_repayments")
      .insert(insertRows as TablesInsert<"loan_repayments">[]);
    if (insErr) {
      return NextResponse.json({ error: "予定表の保存に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ count: insertRows.length });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
