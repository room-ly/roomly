import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { escapeHtml } from "@/lib/escape-html";

// GET: 送金明細のHTML出力（ブラウザ印刷でPDF化）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: remittance, error } = await supabase
      .from("owner_remittances")
      .select("*, owner:owners(name, email, bank_name, bank_branch, bank_account_number, bank_account_holder)")
      .eq("id", id)
      .single();

    if (error || !remittance) {
      return NextResponse.json({ error: "送金データが見つかりません" }, { status: 404 });
    }

    // 明細行（家賃・管理手数料・消費税・経費など）
    const { data: items } = await supabase
      .from("owner_remittance_items")
      .select("item_type, description, amount")
      .eq("remittance_id", id)
      .order("created_at");

    // 費用が家賃を超過した場合、オーナーへ請求する不足分とその入金先(会社の既定口座)
    const ownerBill = Number((remittance as { owner_bill_amount?: number }).owner_bill_amount) || 0;
    const feeTax = Number((remittance as { management_fee_tax?: number }).management_fee_tax) || 0;
    let companyBank: Record<string, string> | null = null;
    if (ownerBill > 0) {
      const { data: banks } = await supabase
        .from("company_bank_accounts")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at")
        .limit(1);
      companyBank = (banks?.[0] as unknown as Record<string, string>) ?? null;
    }
    // 帳票ヘッダ用の自社情報（ロゴ・社名・住所・連絡先）と押印欄設定
    const { data: company } = await supabase
      .from("companies")
      .select("name, postal_code, address, phone, logo_path, seal_column_enabled")
      .single();
    const co = (company ?? null) as Record<string, string | boolean | null> | null;
    const logoPath = (co?.logo_path as string | null) ?? null;
    const logoSrc = logoPath
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${logoPath}`
      : null;
    const sealEnabled = Boolean(co?.seal_column_enabled);
    const coName = escapeHtml((co?.name as string | null) ?? "");
    const coAddress = escapeHtml(
      [(co?.postal_code as string | null) ? `〒${co?.postal_code}` : "", (co?.address as string | null) ?? ""]
        .filter(Boolean)
        .join(" "),
    );
    const coPhone = escapeHtml((co?.phone as string | null) ?? "");

    const acctType = (t: string | undefined) =>
      t === "savings" ? "貯蓄" : t === "checking" ? "当座" : "普通";

    const month = escapeHtml(remittance.remittance_month?.slice(0, 7) ?? "");
    const owner = remittance.owner as Record<string, string> | null;
    const ownerName = escapeHtml(owner?.name ?? "—");
    const bankInfo = escapeHtml(`${owner?.bank_name ?? ""} ${owner?.bank_branch ?? ""} ${owner?.bank_account_number ?? ""}`);
    const statusText = remittance.status === "sent" ? "送金済" : remittance.status === "confirmed" ? "確定" : "下書き";
    const sentDate = escapeHtml(remittance.sent_date ?? "");

    const itemTypeLabel: Record<string, string> = {
      rent: "家賃入金",
      management_fee: "管理手数料（税抜）",
      management_fee_tax: "管理手数料 消費税",
      expense: "経費",
      adjustment: "調整",
    };
    const itemRowsHtml = (items ?? [])
      .map((it) => {
        const amt = Number(it.amount) || 0;
        const sign = amt < 0 ? "negative" : "";
        const prefix = amt < 0 ? "-" : "";
        return `<tr>
        <td>${escapeHtml(itemTypeLabel[it.item_type] ?? it.item_type)}</td>
        <td>${escapeHtml(it.description ?? "")}</td>
        <td class="text-right ${sign}">${prefix}&yen;${Math.abs(amt).toLocaleString()}</td>
      </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>送金明細 - ${month}</title>
  <style>
    body { font-family: "Hiragino Sans", "Yu Gothic", sans-serif; font-size: 13px; color: #333; max-width: 700px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f8f8; font-weight: 500; font-size: 12px; color: #666; }
    .text-right { text-align: right; }
    .total-row { font-weight: 600; border-top: 2px solid #333; }
    .negative { color: #c0392b; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-block label { font-size: 11px; color: #999; display: block; margin-bottom: 2px; }
    .info-block p { margin: 0; font-size: 13px; }
    .doc-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
    .doc-header .company { text-align: right; font-size: 12px; color: #666; line-height: 1.6; }
    .doc-header .company .company-name { font-size: 13px; color: #333; font-weight: 600; }
    .doc-logo { max-height: 56px; max-width: 200px; object-fit: contain; }
    .seal-area { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
    .seal-box { width: 64px; height: 64px; border: 1px solid #ccc; border-radius: 4px; display: flex; align-items: flex-start; justify-content: center; }
    .seal-box span { font-size: 10px; color: #999; margin-top: 4px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      ${logoSrc ? `<img class="doc-logo" src="${escapeHtml(logoSrc)}" alt="${coName}">` : ""}
    </div>
    <div class="company">
      ${coName ? `<div class="company-name">${coName}</div>` : ""}
      ${coAddress ? `<div>${coAddress}</div>` : ""}
      ${coPhone ? `<div>TEL: ${coPhone}</div>` : ""}
    </div>
  </div>

  <h1>オーナー送金明細</h1>
  <p class="subtitle">${month} 分</p>

  <div class="info-grid">
    <div class="info-block">
      <label>オーナー名</label>
      <p>${ownerName}</p>
    </div>
    <div class="info-block">
      <label>振込先</label>
      <p>${bankInfo}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>項目</th>
        <th class="text-right">金額</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>家賃収入合計</td>
        <td class="text-right">&yen;${Number(remittance.total_rent).toLocaleString()}</td>
      </tr>
      <tr>
        <td>管理手数料（税抜）</td>
        <td class="text-right negative">-&yen;${Number(remittance.management_fee_deducted).toLocaleString()}</td>
      </tr>
      ${
        feeTax > 0
          ? `<tr>
        <td>消費税</td>
        <td class="text-right negative">-&yen;${feeTax.toLocaleString()}</td>
      </tr>`
          : ""
      }
      <tr>
        <td>費用控除</td>
        <td class="text-right negative">-&yen;${Number(remittance.expense_deducted).toLocaleString()}</td>
      </tr>
      <tr class="total-row">
        <td>送金額</td>
        <td class="text-right">&yen;${Number(remittance.net_amount).toLocaleString()}</td>
      </tr>
      ${
        ownerBill > 0
          ? `<tr class="total-row">
        <td class="negative">オーナーへ請求（不足分）</td>
        <td class="text-right negative">&yen;${ownerBill.toLocaleString()}</td>
      </tr>`
          : ""
      }
    </tbody>
  </table>
  ${
    itemRowsHtml
      ? `<h2 style="font-size:14px; margin:24px 0 4px;">明細</h2>
  <table>
    <thead>
      <tr>
        <th>区分</th>
        <th>内容</th>
        <th class="text-right">金額</th>
      </tr>
    </thead>
    <tbody>
      ${itemRowsHtml}
    </tbody>
  </table>`
      : ""
  }
  ${
    ownerBill > 0
      ? `<div style="border:1px solid #c0392b; border-radius:6px; padding:12px 16px; margin:16px 0;">
    <p style="margin:0 0 6px; font-weight:600; color:#c0392b;">費用が家賃収入を超過したため、不足分 &yen;${ownerBill.toLocaleString()} をご入金ください</p>
    ${
      companyBank
        ? `<p style="margin:0; font-size:13px;">入金先: ${escapeHtml(
            `${companyBank.bank_name ?? ""} ${companyBank.branch_name ?? ""} ${acctType(companyBank.account_type)} ${companyBank.account_number ?? ""}（${companyBank.account_holder ?? ""}）`,
          )}</p>`
        : `<p style="margin:0; font-size:12px; color:#999;">※ 入金先口座が未登録です</p>`
    }
  </div>`
      : ""
  }

  ${
    sealEnabled
      ? `<div class="seal-area">
    <div class="seal-box"><span>担当</span></div>
    <div class="seal-box"><span>確認</span></div>
    <div class="seal-box"><span>承認</span></div>
  </div>`
      : ""
  }

  <p style="color: #999; font-size: 11px; margin-top: 32px;">
    ステータス: ${statusText}
    ${sentDate ? ` / 送金日: ${sentDate}` : ""}
  </p>

  <script>
    // ロゴ画像の読み込み完了を待ってから印刷する（未待機だとロゴが欠けたPDFになる）
    window.addEventListener("load", function () { window.print(); });
  </script>
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
