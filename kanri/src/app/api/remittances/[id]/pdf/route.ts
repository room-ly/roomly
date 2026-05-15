import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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

    const month = remittance.remittance_month?.slice(0, 7) ?? "";
    const owner = remittance.owner as Record<string, string> | null;

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
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>オーナー送金明細</h1>
  <p class="subtitle">${month} 分</p>

  <div class="info-grid">
    <div class="info-block">
      <label>オーナー名</label>
      <p>${owner?.name ?? "—"}</p>
    </div>
    <div class="info-block">
      <label>振込先</label>
      <p>${owner?.bank_name ?? ""} ${owner?.bank_branch ?? ""} ${owner?.bank_account_number ?? ""}</p>
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
        <td>管理手数料控除</td>
        <td class="text-right negative">-&yen;${Number(remittance.management_fee_deducted).toLocaleString()}</td>
      </tr>
      <tr>
        <td>経費控除</td>
        <td class="text-right negative">-&yen;${Number(remittance.expense_deducted).toLocaleString()}</td>
      </tr>
      <tr class="total-row">
        <td>送金額</td>
        <td class="text-right">&yen;${Number(remittance.net_amount).toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <p style="color: #999; font-size: 11px; margin-top: 32px;">
    ステータス: ${remittance.status === "sent" ? "送金済" : remittance.status === "confirmed" ? "確定" : "下書き"}
    ${remittance.sent_date ? ` / 送金日: ${remittance.sent_date}` : ""}
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
