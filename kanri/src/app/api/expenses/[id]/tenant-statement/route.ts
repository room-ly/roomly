import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { escapeHtml } from "@/lib/escape-html";
import { toJpy } from "@/lib/deposit-unit";

// GET: 入居者への「敷金充当明細書」HTML出力（ブラウザ印刷でPDF化）。
// 入居者負担分(tenant_amount)を敷金から充当した旨と、充当後の敷金残高を通知する明細書。
// 二重請求を避けるため、別途の現金請求ではなく充当の事実を伝える書面。
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
        "*, property:properties(name), unit:units(unit_number), contract:contracts(id, deposit, deposit_unit, rent, tenant:tenants(name))",
      )
      .eq("id", id)
      .single();

    if (error || !expense) {
      return NextResponse.json({ error: "費用データが見つかりません" }, { status: 404 });
    }

    const tenantAmount = Number((expense as { tenant_amount?: number }).tenant_amount) || 0;
    const contract = (expense as { contract?: Record<string, unknown> | null }).contract ?? null;
    if (tenantAmount <= 0 || !contract?.id) {
      return NextResponse.json(
        { error: "入居者負担（敷金充当）がないため明細書を作成できません" },
        { status: 400 },
      );
    }

    // 充当後の敷金残高 = 初期敷金 - charge合計 + refund合計
    const initialDeposit = toJpy(contract.deposit, contract.deposit_unit, contract.rent);
    const { data: txs } = await supabase
      .from("deposit_transactions")
      .select("amount, transaction_type")
      .eq("contract_id", contract.id as string);
    let balance = initialDeposit;
    for (const t of txs ?? []) {
      const amt = Number((t as { amount?: number }).amount) || 0;
      const type = (t as { transaction_type?: string }).transaction_type;
      if (type === "initial_deposit") continue; // initialDeposit を起点にしているので二重加算しない
      if (type === "charge") balance -= amt;
      else if (type === "refund") balance += amt;
      else if (type === "additional_billing") balance += amt;
    }

    const tenant = (contract.tenant as { name?: string } | null) ?? null;
    const tenantName = tenant?.name ?? "—";
    const property = (expense as { property?: Record<string, string> | null }).property ?? null;
    const unit = (expense as { unit?: Record<string, string> | null }).unit ?? null;
    const propLabel = [property?.name, unit?.unit_number].filter(Boolean).join(" ");
    const expenseDate = (expense as { expense_date?: string }).expense_date ?? "";
    const description = (expense as { description?: string }).description ?? "";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>敷金充当明細書 - ${escapeHtml(tenantName)}</title>
  <style>
    body { font-family: "Hiragino Sans", "Yu Gothic", sans-serif; font-size: 13px; color: #333; max-width: 640px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f8f8; font-weight: 500; font-size: 12px; color: #666; }
    .text-right { text-align: right; }
    .total-row { font-weight: 600; border-top: 2px solid #333; }
    .negative { color: #c0392b; }
    .lead { background:#f7fafc; border-radius:8px; padding:14px 18px; margin:16px 0; font-size:13px; line-height:1.7; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>敷金充当のお知らせ</h1>
  <p class="subtitle">${escapeHtml(propLabel)}　${escapeHtml(tenantName)} 様</p>

  <div class="lead">
    下記の費用について、${escapeHtml(tenantName)} 様のご負担分をお預かりしている敷金から充当いたしましたので、ご通知申し上げます。
  </div>

  <table>
    <tbody>
      <tr>
        <th>発生日</th>
        <td>${escapeHtml(expenseDate)}</td>
      </tr>
      <tr>
        <th>内容</th>
        <td>${escapeHtml(description)}</td>
      </tr>
    </tbody>
  </table>

  <table>
    <thead>
      <tr>
        <th>項目</th>
        <th class="text-right">金額</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>お預かり敷金</td>
        <td class="text-right">&yen;${initialDeposit.toLocaleString()}</td>
      </tr>
      <tr>
        <td>今回の充当額</td>
        <td class="text-right negative">-&yen;${tenantAmount.toLocaleString()}</td>
      </tr>
      <tr class="total-row">
        <td>充当後の敷金残高</td>
        <td class="text-right">&yen;${balance.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <p style="color:#999; font-size:11px; margin-top:32px;">
    ※ 残高は本書発行時点のものです。退去時に他の精算が発生する場合があります。
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
