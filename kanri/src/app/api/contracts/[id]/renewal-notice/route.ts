import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { formatPhone } from "@/lib/phone";
import { escapeHtml } from "@/lib/escape-html";

function formatJpDate(iso?: string | null) {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
}

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

    // 新しい契約期間の提案: 現契約と同じ期間（年数）で end_date + 1日 から
    const newStart = (() => {
      if (!contract.end_date) return "";
      const d = new Date(contract.end_date);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })();
    const newEnd = (() => {
      if (!contract.start_date || !contract.end_date) return "";
      const start = new Date(contract.start_date);
      const end = new Date(contract.end_date);
      const years = Math.max(1, Math.round((end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
      const d = new Date(contract.end_date);
      d.setFullYear(d.getFullYear() + years);
      return d.toISOString().slice(0, 10);
    })();

    const propertyName = escapeHtml(property?.name ?? "");
    const unitNumber = escapeHtml(unit?.unit_number ?? "");
    const propertyAddress = escapeHtml(property?.address ?? "");
    const tenantName = escapeHtml(tenant?.name ?? "");
    const tenantPostalCode = escapeHtml(tenant?.postal_code ?? "");
    const tenantAddress = escapeHtml(tenant?.address ?? "");
    const startDate = escapeHtml(formatJpDate(contract.start_date));
    const endDate = escapeHtml(formatJpDate(contract.end_date));
    const newStartJp = escapeHtml(formatJpDate(newStart));
    const newEndJp = escapeHtml(formatJpDate(newEnd));
    const rent = Number(contract.rent || 0).toLocaleString();
    const managementFee = Number(contract.management_fee || 0).toLocaleString();
    const monthlyTotal = (Number(contract.rent || 0) + Number(contract.management_fee || 0)).toLocaleString();
    const renewalFeeJpy = (contract.renewal_fee_unit === "months"
      ? Math.round(Number(contract.renewal_fee || 0) * Number(contract.rent || 0))
      : Math.round(Number(contract.renewal_fee || 0))).toLocaleString();
    const renewalFee = contract.renewal_fee_unit === "months"
      ? `賃料の${Number(contract.renewal_fee || 0)}ヶ月分（¥${renewalFeeJpy}）`
      : `¥${renewalFeeJpy}`;
    const companyName = escapeHtml(company?.name ?? "");
    const companyPostalCode = escapeHtml(company?.postal_code ?? "");
    const companyAddress = escapeHtml(company?.address ?? "");
    const companyPhone = escapeHtml(formatPhone(company?.phone) || "");
    const todayJp = escapeHtml(formatJpDate(today));

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>契約更新のご案内 - ${propertyName} ${unitNumber}号室</title>
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
    .from-block {
      text-align: right;
      margin-bottom: 32px;
      line-height: 1.9;
    }
    .from-block .company-name { font-weight: bold; font-size: 15px; }
    .body-text {
      margin-bottom: 20px;
      text-indent: 1em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 28px;
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
    .amount { text-align: right; font-family: "Courier New", monospace; }
    h2 {
      font-size: 15px;
      margin-top: 24px;
      margin-bottom: 8px;
      padding-left: 8px;
      border-left: 4px solid #1a365d;
    }
    .reply-section {
      margin-top: 32px;
      padding: 18px;
      background: #fafafa;
      border: 1px solid #ddd;
    }
    .reply-section h3 { font-size: 14px; margin-bottom: 10px; }
    .checkbox-line { margin: 6px 0; }
    .checkbox { display: inline-block; width: 14px; height: 14px; border: 1px solid #333; vertical-align: middle; margin-right: 8px; }
    .sign-line {
      display: flex;
      gap: 24px;
      margin-top: 18px;
    }
    .sign-line > div { flex: 1; }
    .sign-label { font-size: 12px; color: #666; margin-bottom: 4px; }
    .sign-box { border-bottom: 1px solid #999; height: 28px; }
    .note-section {
      margin-top: 24px;
      padding: 14px 16px;
      background: #fff8e1;
      border: 1px solid #f0d875;
      font-size: 12px;
      line-height: 1.9;
    }
    .note-section h3 { font-size: 13px; margin-bottom: 6px; }
    .footer-note {
      margin-top: 36px;
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
  <h1>契約更新のご案内</h1>

  <div class="date-block">
    <p>${todayJp}</p>
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
    平素より格別のご愛顧を賜り、誠にありがとうございます。
  </p>
  <p class="body-text">
    お客様がご契約の下記物件につきまして、契約満了日が近づいておりますので、ご案内申し上げます。引き続きご入居をご希望の場合は、下記内容をご確認のうえ、本書面に必要事項をご記入いただき、ご返送くださいますようお願い申し上げます。
  </p>

  <h2>現在の契約内容</h2>
  <table>
    <tbody>
      <tr><th>物件名</th><td>${propertyName}</td></tr>
      <tr><th>部屋番号</th><td>${unitNumber}号室</td></tr>
      <tr><th>物件所在地</th><td>${propertyAddress}</td></tr>
      <tr><th>契約期間</th><td>${startDate} 〜 ${endDate}</td></tr>
      <tr><th>賃料</th><td class="amount">¥${rent}</td></tr>
      <tr><th>管理費・共益費</th><td class="amount">¥${managementFee}</td></tr>
      <tr><th>月額合計</th><td class="amount"><strong>¥${monthlyTotal}</strong></td></tr>
    </tbody>
  </table>

  <h2>更新後の契約内容（ご提案）</h2>
  <table>
    <tbody>
      <tr><th>新契約期間</th><td>${newStartJp} 〜 ${newEndJp}</td></tr>
      <tr><th>賃料</th><td class="amount">¥${rent}</td></tr>
      <tr><th>管理費・共益費</th><td class="amount">¥${managementFee}</td></tr>
      <tr><th>月額合計</th><td class="amount"><strong>¥${monthlyTotal}</strong></td></tr>
      <tr><th>更新料</th><td class="amount">${renewalFee}</td></tr>
    </tbody>
  </table>

  <div class="reply-section">
    <h3>【ご回答欄】下記いずれかにチェックのうえ、ご返送ください</h3>
    <div class="checkbox-line">
      <span class="checkbox"></span> 更新を希望します（上記内容で更新契約書を作成いたします）
    </div>
    <div class="checkbox-line">
      <span class="checkbox"></span> 更新条件について相談したい（担当者よりご連絡いたします）
    </div>
    <div class="checkbox-line">
      <span class="checkbox"></span> 契約満了に伴い退去します（別途、解約通知書をご提出ください）
    </div>

    <div class="sign-line">
      <div>
        <div class="sign-label">ご記入日</div>
        <div class="sign-box"></div>
      </div>
      <div>
        <div class="sign-label">ご署名</div>
        <div class="sign-box"></div>
      </div>
    </div>
  </div>

  <div class="note-section">
    <h3>【ご注意事項】</h3>
    <ul style="padding-left: 1.2em;">
      <li>本書面は契約満了の事前ご案内です。更新条件の最終内容は、別途お送りする更新契約書をご確認ください。</li>
      <li>更新を希望されない場合は、契約書記載の予告期間内に解約通知書をご提出ください。</li>
      <li>ご不明な点は上記連絡先までお問い合わせください。</li>
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
