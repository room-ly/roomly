import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { formatPhone } from "@/lib/phone";
import { escapeHtml } from "@/lib/escape-html";
import { computeDepositBalance, type DepositTx } from "@/lib/deposit-calc";
import { toJpy } from "@/lib/deposit-unit";

const yen = (n: number) => `¥${Math.round(n).toLocaleString()}`;
const acctType = (t: string | null | undefined) =>
  t === "savings" ? "貯蓄" : t === "checking" ? "当座" : "普通";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const companyId = await getCompanyId();

    const { data: contract, error } = await supabase
      .from("contracts")
      .select(
        "*, tenant:tenants(name, name_kana, postal_code, address), unit:units(unit_number, property:properties(name, address))"
      )
      .eq("id", id)
      .single();

    if (error || !contract) {
      return NextResponse.json(
        { error: "契約データが見つかりません" },
        { status: 404 }
      );
    }

    const { data: company } = await supabase
      .from("companies")
      .select("name, postal_code, address, phone")
      .eq("id", companyId)
      .single();

    // 敷金トランザクション（取崩・返金・追加敷金）
    const { data: txs } = await supabase
      .from("deposit_transactions")
      .select("transaction_type, amount")
      .eq("contract_id", id);

    // 今回の退去で精算する借主負担費用（原状回復等）
    const { data: expenses } = await supabase
      .from("expenses")
      .select("expense_date, description, category, tenant_amount")
      .eq("contract_id", id)
      .gt("tenant_amount", 0)
      .order("expense_date");

    const tenant = contract.tenant as Record<string, string> | null;
    const unit = contract.unit as Record<string, any> | null;
    const property = unit?.property as Record<string, string> | null;
    const today = new Date().toISOString().slice(0, 10);

    // 預り敷金残高（contracts.deposit を円換算し、initial_deposit/charge/refund を反映）
    const initial = toJpy(contract.deposit, contract.deposit_unit, contract.rent);
    const dep = computeDepositBalance(initial, (txs ?? []) as DepositTx[]);

    // 今回精算する借主負担合計
    const tenantTotal = (expenses ?? []).reduce(
      (s, e) => s + (Number(e.tenant_amount) || 0),
      0
    );

    // 差引: プラス=返還、マイナス=追加請求
    const net = dep.balance - tenantTotal;
    const isRefund = net >= 0;
    const refundAmount = isRefund ? net : 0;
    const additionalBill = isRefund ? 0 : -net;

    // 追加請求がある場合は会社の既定口座を入金先として表示
    let companyBank: Record<string, string> | null = null;
    if (additionalBill > 0) {
      const { data: banks } = await supabase
        .from("company_bank_accounts")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at")
        .limit(1);
      companyBank = (banks?.[0] as unknown as Record<string, string>) ?? null;
    }

    const propertyName = escapeHtml(property?.name ?? "");
    const unitNumber = escapeHtml(unit?.unit_number ?? "");
    const propertyAddress = escapeHtml(property?.address ?? "");
    const tenantName = escapeHtml(tenant?.name ?? "");
    const tenantPostalCode = escapeHtml(tenant?.postal_code ?? "");
    const tenantAddress = escapeHtml(tenant?.address ?? "");
    const startDate = escapeHtml(contract.start_date ?? "");
    const endDate = escapeHtml(contract.end_date ?? "");
    // 退去日は move_out_date 優先、無ければ契約満了日でフォールバック
    const moveOutDate = escapeHtml(contract.move_out_date || contract.end_date || "");
    const companyName = escapeHtml(company?.name ?? "");
    const companyPostalCode = escapeHtml(company?.postal_code ?? "");
    const companyAddress = escapeHtml(company?.address ?? "");
    const companyPhone = escapeHtml(formatPhone(company?.phone) || "");

    // 借主負担費用の明細行
    const expenseRowsHtml =
      (expenses ?? []).length > 0
        ? (expenses ?? [])
            .map(
              (e) => `<tr>
        <td>${escapeHtml(e.expense_date ?? "")}</td>
        <td>${escapeHtml(e.description ?? "")}</td>
        <td>${escapeHtml(e.category ?? "")}</td>
        <td class="amount">${yen(Number(e.tenant_amount) || 0)}</td>
      </tr>`
            )
            .join("")
        : `<tr><td colspan="4" style="text-align:center;color:#999;">借主ご負担となる原状回復費用はありません</td></tr>`;

    // 返還時の振込先（入居者の口座は保持していないため案内文を出す）
    const tenantBankHtml = `<p style="color:#666;">※ ご返金先の口座情報を上記連絡先までお知らせください。確認のうえお振込みいたします。</p>`;

    // 入金先（追加請求時は会社の既定口座）
    const companyBankHtml = (() => {
      if (!companyBank) {
        return `<p style="color:#999;">※ 入金先口座が未登録です。設定画面でご登録ください。</p>`;
      }
      const bn = escapeHtml(companyBank.bank_name ?? "");
      const br = escapeHtml(companyBank.branch_name ?? "");
      const at = acctType(companyBank.account_type);
      const num = escapeHtml(companyBank.account_number ?? "");
      const holder = escapeHtml(companyBank.account_holder ?? "");
      return `<p>${bn} ${br} ${at} ${num}</p><p>名義: ${holder}</p>`;
    })();

    // 精算結果ブロック
    const resultBlock = (() => {
      if (net === 0) {
        return `<div class="result-block result-even">
          <div class="result-label">精算結果</div>
          <div class="result-amount">精算の結果、ご返金・追加のご請求はございません。</div>
        </div>`;
      }
      if (isRefund) {
        return `<div class="result-block result-refund">
          <div class="result-label">敷金ご返還額（税込）</div>
          <div class="result-amount">${yen(refundAmount)}</div>
          <div class="result-bank">
            <p style="font-weight:600;margin-bottom:4px;">ご返金先</p>
            ${tenantBankHtml}
          </div>
        </div>`;
      }
      return `<div class="result-block result-bill">
        <div class="result-label">追加ご請求額（税込）</div>
        <div class="result-amount">${yen(additionalBill)}</div>
        <div class="result-bank">
          <p style="font-weight:600;margin-bottom:4px;">お振込先</p>
          ${companyBankHtml}
        </div>
      </div>`;
    })();

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>退去精算書 - ${propertyName} ${unitNumber}号室</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS PMincho", serif;
      font-size: 14px;
      color: #333;
      max-width: 740px;
      margin: 0 auto;
      padding: 40px 40px 60px;
      line-height: 1.8;
    }
    h1 {
      text-align: center;
      font-size: 22px;
      letter-spacing: 0.3em;
      margin-bottom: 36px;
      padding-bottom: 8px;
      border-bottom: 2px solid #333;
    }
    .date-block { text-align: right; margin-bottom: 24px; }
    .to-block { margin-bottom: 24px; }
    .to-block p { margin-bottom: 2px; }
    .to-block .tenant-name { font-size: 16px; font-weight: bold; margin-top: 6px; }
    .from-block { text-align: right; margin-bottom: 32px; line-height: 1.9; }
    .from-block .company-name { font-weight: bold; font-size: 15px; }
    .body-text { margin-bottom: 20px; text-indent: 1em; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 28px; }
    th, td { border: 1px solid #999; padding: 10px 14px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; font-weight: 600; white-space: nowrap; }
    table.kv th { width: 160px; }
    .amount { text-align: right; font-family: "Courier New", monospace; white-space: nowrap; }
    .total-row th, .total-row td { background: #f5f5f5; font-weight: bold; }
    h2 {
      font-size: 15px; margin-top: 24px; margin-bottom: 8px;
      padding-left: 8px; border-left: 4px solid #1a365d;
    }
    .result-block { margin-top: 28px; padding: 20px 24px; border-radius: 8px; text-align: center; }
    .result-refund { background: #f0f7f2; border: 2px solid #2f855a; }
    .result-bill { background: #fdf2f2; border: 2px solid #c53030; }
    .result-even { background: #f7fafc; border: 2px solid #999; }
    .result-label { font-size: 13px; color: #555; margin-bottom: 4px; }
    .result-amount { font-size: 26px; font-weight: bold; font-family: "Courier New", monospace; }
    .result-refund .result-amount { color: #2f855a; }
    .result-bill .result-amount { color: #c53030; }
    .result-even .result-amount { font-size: 15px; }
    .result-bank { margin-top: 14px; padding-top: 12px; border-top: 1px dashed #bbb; text-align: left; font-size: 13px; font-family: "Hiragino Sans", sans-serif; }
    .note-section {
      margin-top: 24px; padding: 14px 16px; background: #fff8e1;
      border: 1px solid #f0d875; font-size: 12px; line-height: 1.9;
    }
    .note-section h3 { font-size: 13px; margin-bottom: 6px; }
    .footer-note { margin-top: 36px; font-size: 11px; color: #999; text-align: center; }
    @media print {
      body { margin: 0; padding: 20mm 15mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>退去精算書</h1>

  <div class="date-block">
    <p>${escapeHtml(today)}</p>
  </div>

  <div class="to-block">
    ${tenantAddress ? `<p>${tenantPostalCode ? "〒" + tenantPostalCode + " " : ""}${tenantAddress}</p>` : ""}
    <p class="tenant-name">${tenantName} 様</p>
  </div>

  <div class="from-block">
    <p class="company-name">${companyName || "（設定画面で会社名を入力してください）"}</p>
    ${companyAddress ? `<p>${companyPostalCode ? "〒" + companyPostalCode + " " : ""}${companyAddress}</p>` : ""}
    ${companyPhone ? `<p>TEL: ${companyPhone}</p>` : ""}
  </div>

  <p class="body-text">
    このたびはご退去にあたり、下記のとおり敷金の精算をご案内申し上げます。内容をご確認くださいますようお願い申し上げます。
  </p>

  <h2>対象物件・退去情報</h2>
  <table class="kv">
    <tbody>
      <tr><th>物件名</th><td>${propertyName}</td></tr>
      <tr><th>部屋番号</th><td>${unitNumber}号室</td></tr>
      <tr><th>物件所在地</th><td>${propertyAddress}</td></tr>
      <tr><th>契約期間</th><td>${startDate} 〜 ${endDate}</td></tr>
      <tr><th>退去日</th><td>${moveOutDate}</td></tr>
    </tbody>
  </table>

  <h2>敷金の内訳</h2>
  <table class="kv">
    <tbody>
      <tr><th>お預かり敷金</th><td class="amount">${yen(dep.initial)}（税込）</td></tr>
      ${dep.charged > 0 ? `<tr><th>既充当済み</th><td class="amount">-${yen(dep.charged)}（税込）</td></tr>` : ""}
      ${dep.refunded > 0 ? `<tr><th>既返金済み</th><td class="amount">-${yen(dep.refunded)}（税込）</td></tr>` : ""}
      <tr class="total-row"><th>敷金残高</th><td class="amount">${yen(dep.balance)}（税込）</td></tr>
    </tbody>
  </table>

  <h2>原状回復費用（借主ご負担分）</h2>
  <table>
    <thead>
      <tr><th>日付</th><th>内容</th><th>区分</th><th class="amount">金額</th></tr>
    </thead>
    <tbody>
      ${expenseRowsHtml}
      <tr class="total-row"><td colspan="3">借主ご負担合計</td><td class="amount">${yen(tenantTotal)}（税込）</td></tr>
    </tbody>
  </table>

  <h2>精算結果</h2>
  <table class="kv">
    <tbody>
      <tr><th>敷金残高</th><td class="amount">${yen(dep.balance)}（税込）</td></tr>
      <tr><th>借主ご負担合計</th><td class="amount">-${yen(tenantTotal)}（税込）</td></tr>
      <tr class="total-row"><th>差引</th><td class="amount">${net < 0 ? "-" : ""}${yen(Math.abs(net))}（税込）</td></tr>
    </tbody>
  </table>

  ${resultBlock}

  <div class="note-section">
    <h3>【ご注意事項】</h3>
    <ul style="padding-left: 1.2em;">
      <li>原状回復費用は、国土交通省「原状回復をめぐるトラブルとガイドライン」に基づき、通常損耗・経年変化を除いた借主のご負担分を算定しています。</li>
      <li>金額はすべて税込です。明細についてご不明な点は、上記連絡先までお問い合わせください。</li>
    </ul>
  </div>

  <p class="footer-note">
    本書は${companyName}が管理するシステムより出力されました
  </p>

  <div class="no-print" style="text-align:center; margin: 32px 0 8px;">
    <button onclick="window.print()" style="padding: 10px 32px; font-size: 14px; cursor: pointer; background: #1a365d; color: #fff; border: none; border-radius: 6px;">印刷 / PDF保存</button>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
