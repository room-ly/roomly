import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { formatPhone } from "@/lib/phone";
import { escapeHtml } from "@/lib/escape-html";

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
        "*, tenant:tenants(name, name_kana, phone, email, postal_code, address), unit:units(unit_number, property:properties(name, address))"
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

    const tenant = contract.tenant as Record<string, string> | null;
    const unit = contract.unit as Record<string, any> | null;
    const property = unit?.property as Record<string, string> | null;
    const today = new Date().toISOString().slice(0, 10);

    const propertyName = escapeHtml(property?.name ?? "");
    const unitNumber = escapeHtml(unit?.unit_number ?? "");
    const propertyAddress = escapeHtml(property?.address ?? "");
    const tenantName = escapeHtml(tenant?.name ?? "");
    const tenantPhone = escapeHtml(formatPhone(tenant?.phone) || "");
    const tenantEmail = escapeHtml(tenant?.email ?? "");
    const startDate = escapeHtml(contract.start_date ?? "");
    const companyName = escapeHtml(company?.name ?? "");
    const companyPostalCode = escapeHtml(company?.postal_code ?? "");
    const companyAddress = escapeHtml(company?.address ?? "");
    const companyPhone = escapeHtml(formatPhone(company?.phone) || "");

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>解約通知書（退去届） - ${propertyName} ${unitNumber}号室</title>
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
    .to-block {
      margin-bottom: 24px;
    }
    .to-block .company-name {
      font-size: 16px;
      font-weight: bold;
    }
    .date-block {
      text-align: right;
      margin-bottom: 28px;
    }
    .from-block {
      text-align: right;
      margin-bottom: 32px;
      line-height: 2;
    }
    .body-text {
      margin-bottom: 24px;
      text-indent: 1em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0 32px;
    }
    th, td {
      border: 1px solid #999;
      padding: 10px 14px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f5f5f5;
      width: 160px;
      font-weight: 600;
      white-space: nowrap;
    }
    td {
      min-height: 20px;
    }
    .input-line {
      border-bottom: 1px solid #ccc;
      min-width: 200px;
      display: inline-block;
      padding-bottom: 2px;
    }
    .note-section {
      margin-top: 28px;
      padding: 16px;
      background: #fafafa;
      border: 1px solid #ddd;
      font-size: 12px;
      line-height: 1.9;
    }
    .note-section h3 {
      font-size: 13px;
      margin-bottom: 8px;
    }
    .seal-area {
      display: inline-block;
      width: 48px;
      height: 48px;
      border: 1px solid #ccc;
      border-radius: 50%;
      text-align: center;
      line-height: 48px;
      font-size: 10px;
      color: #ccc;
      margin-left: 8px;
      vertical-align: middle;
    }
    .footer-note {
      margin-top: 40px;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    @media print {
      body { margin: 0; padding: 20mm 15mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>解約通知書（退去届）</h1>

  <div class="to-block">
    <p class="company-name">${companyName || "（設定画面で会社名を入力してください）"} 御中</p>
    ${companyAddress ? `<p>${companyPostalCode ? "〒" + companyPostalCode + " " : ""}${companyAddress}</p>` : ""}
    ${companyPhone ? `<p>TEL: ${companyPhone}</p>` : ""}
  </div>

  <div class="date-block">
    <p>届出日：${today.replace(/-/g, " 年 ").replace(/ 年 /, "年").replace(/ 年 /, "月")}日</p>
  </div>

  <div class="from-block">
    <p>届出者（契約者）</p>
    <p>氏名：${tenantName}<span class="seal-area">印</span></p>
  </div>

  <p class="body-text">
    下記の賃貸借契約について、解約の通知をいたします。退去に関する手続きをお願いいたします。
  </p>

  <table>
    <tbody>
      <tr>
        <th>物件名</th>
        <td>${propertyName}</td>
      </tr>
      <tr>
        <th>部屋番号</th>
        <td>${unitNumber}号室</td>
      </tr>
      <tr>
        <th>物件所在地</th>
        <td>${propertyAddress}</td>
      </tr>
      <tr>
        <th>契約者氏名</th>
        <td>${tenantName}</td>
      </tr>
      <tr>
        <th>連絡先電話番号</th>
        <td>${tenantPhone}</td>
      </tr>
      <tr>
        <th>連絡先メール</th>
        <td>${tenantEmail}</td>
      </tr>
      <tr>
        <th>契約開始日</th>
        <td>${startDate}</td>
      </tr>
      <tr>
        <th>退去予定日</th>
        <td class="input-line" style="border-bottom: none;">
          <span class="input-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;年&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;月&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;日</span>
        </td>
      </tr>
      <tr>
        <th>退去理由</th>
        <td style="height: 60px;"></td>
      </tr>
      <tr>
        <th>転居先住所</th>
        <td style="height: 40px;"></td>
      </tr>
      <tr>
        <th>転居先電話番号</th>
        <td></td>
      </tr>
    </tbody>
  </table>

  <h3 style="font-size: 14px; margin-bottom: 12px;">敷金返還先口座</h3>
  <table>
    <tbody>
      <tr>
        <th>金融機関名</th>
        <td></td>
      </tr>
      <tr>
        <th>支店名</th>
        <td></td>
      </tr>
      <tr>
        <th>口座種別</th>
        <td>普通 ・ 当座</td>
      </tr>
      <tr>
        <th>口座番号</th>
        <td></td>
      </tr>
      <tr>
        <th>口座名義</th>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div class="note-section">
    <h3>【注意事項】</h3>
    <ul style="padding-left: 1.2em;">
      <li>解約の申し入れは、契約書に定められた予告期間（通常1〜2ヶ月前）までにお願いいたします。</li>
      <li>退去日が確定しましたら、退去立会いの日程調整のためご連絡ください。</li>
      <li>退去時には鍵の返却をお願いいたします（スペアキー含む）。</li>
      <li>原状回復につきましては、国土交通省「原状回復をめぐるトラブルとガイドライン」に基づき対応いたします。</li>
      <li>敷金の精算は退去立会い完了後、1ヶ月程度を目安にご指定の口座へお振り込みいたします。</li>
    </ul>
  </div>

  <p class="footer-note">
    本書は${companyName}が管理するシステムより出力されました
  </p>

  <script>window.print();</script>
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
