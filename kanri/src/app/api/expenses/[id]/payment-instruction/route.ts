import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { escapeHtml } from "@/lib/escape-html";

const acctType = (t: string | undefined) =>
  t === "savings" ? "貯蓄" : t === "current" || t === "checking" ? "当座" : "普通";

// GET: 業者(支払先)への振込依頼書/支払明細のHTML出力（ブラウザ印刷でPDF化）。
// 「最初に誰が業者へ払うか=自社が業者へ振り込む」前提で、支払先の口座情報をまとめた振込用紙代わり。
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: expense, error } = await supabase
      .from("expenses")
      .select(
        "*, payee:payees(name, name_kana, bank_name, bank_code, branch_name, branch_code, account_type, account_number, account_holder_kana), property:properties(name), unit:units(unit_number)",
      )
      .eq("id", id)
      .single();

    if (error || !expense) {
      return NextResponse.json({ error: "費用データが見つかりません" }, { status: 404 });
    }

    const payee = (expense as { payee?: Record<string, string> | null }).payee ?? null;
    if (!payee) {
      return NextResponse.json(
        { error: "支払先が未設定のため振込依頼書を作成できません" },
        { status: 400 },
      );
    }

    // 振込元（自社の既定口座）
    const { data: banks } = await supabase
      .from("company_bank_accounts")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at")
      .limit(1);
    const fromBank = (banks?.[0] as unknown as Record<string, string>) ?? null;

    const property = (expense as { property?: Record<string, string> | null }).property ?? null;
    const unit = (expense as { unit?: Record<string, string> | null }).unit ?? null;
    const amount = Number((expense as { amount?: number }).amount) || 0;
    const dueDate = (expense as { payment_due_date?: string | null }).payment_due_date ?? "";
    const expenseDate = (expense as { expense_date?: string }).expense_date ?? "";
    const description = (expense as { description?: string }).description ?? "";

    const payeeBankLine = `${payee.bank_name ?? ""}${payee.bank_code ? `（${payee.bank_code}）` : ""} ${payee.branch_name ?? ""}${payee.branch_code ? `（${payee.branch_code}）` : ""} ${acctType(payee.account_type)} ${payee.account_number ?? ""}`;
    const fromBankLine = fromBank
      ? `${fromBank.bank_name ?? ""} ${fromBank.branch_name ?? ""} ${acctType(fromBank.account_type)} ${fromBank.account_number ?? ""}（${fromBank.account_holder ?? ""}）`
      : "";

    const propLabel = [property?.name, unit?.unit_number].filter(Boolean).join(" ");

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>振込依頼書 - ${escapeHtml(payee.name ?? "")}</title>
  <style>
    body { font-family: "Hiragino Sans", "Yu Gothic", sans-serif; font-size: 13px; color: #333; max-width: 640px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; vertical-align: top; }
    th { background: #f8f8f8; font-weight: 500; font-size: 12px; color: #666; width: 130px; }
    .amount-box { border: 2px solid #1a365d; border-radius: 8px; padding: 16px 20px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }
    .amount-box .label { font-size: 13px; color: #666; }
    .amount-box .value { font-size: 26px; font-weight: 700; color: #1a365d; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>振込依頼書</h1>
  <p class="subtitle">${escapeHtml(expenseDate)} 発生分</p>

  <div class="amount-box">
    <span class="label">お振込金額</span>
    <span class="value">&yen;${amount.toLocaleString()}</span>
  </div>

  <table>
    <tbody>
      <tr>
        <th>支払先（受取人）</th>
        <td>${escapeHtml(payee.name ?? "")}${payee.name_kana ? `<br><span style="font-size:11px;color:#999;">${escapeHtml(payee.name_kana)}</span>` : ""}</td>
      </tr>
      <tr>
        <th>振込先口座</th>
        <td>${escapeHtml(payeeBankLine.trim()) || '<span style="color:#c0392b;">※ 口座情報が未登録です</span>'}
        ${payee.account_holder_kana ? `<br><span style="font-size:11px;color:#999;">名義: ${escapeHtml(payee.account_holder_kana)}</span>` : ""}</td>
      </tr>
      <tr>
        <th>件名</th>
        <td>${escapeHtml(description)}${propLabel ? `（${escapeHtml(propLabel)}）` : ""}</td>
      </tr>
      ${dueDate ? `<tr><th>支払期日</th><td>${escapeHtml(dueDate)}</td></tr>` : ""}
      ${fromBankLine ? `<tr><th>振込元口座</th><td>${escapeHtml(fromBankLine.trim())}</td></tr>` : ""}
    </tbody>
  </table>

  <p style="color:#999; font-size:11px; margin-top:32px;">
    ※ 本書は振込内容の控えです。実際の振込手続きは金融機関にてお願いします。
  </p>

  <script>window.print();</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
