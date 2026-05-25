import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { effectiveFeeRate } from "@/lib/remittance-calc";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const month = _request.nextUrl.searchParams.get("month");
    if (!month) {
      return NextResponse.json({ error: "month パラメータが必要です" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: owner, error: ownerError } = await supabase
      .from("owners")
      .select("name, properties(id, name, management_fee_rate, management_form, units(id, unit_number, rent, status))")
      .eq("id", id)
      .single();

    if (ownerError || !owner) {
      return NextResponse.json({ error: "オーナーが見つかりません" }, { status: 404 });
    }

    const monthStart = `${month}-01`;
    const nextMonth = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]), 1);
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    const properties = (owner.properties as any[]) || [];
    const propertyIds = properties.map((p: any) => p.id);

    const [{ data: billings }, { data: expenses }] = await Promise.all([
      supabase
        .from("rent_billings")
        .select("total_amount, status, contract:contracts(unit:units(id, unit_number, property_id))")
        .gte("billing_month", monthStart)
        .lt("billing_month", monthEnd),
      supabase
        .from("expenses")
        .select("amount, description, property_id, expense_date")
        .in("property_id", propertyIds.length > 0 ? propertyIds : ["__none__"])
        .gte("expense_date", monthStart)
        .lt("expense_date", monthEnd),
    ]);

    const propertyReport = properties.map((p: any) => {
      const units = (p.units as any[]) || [];
      const pBillings = (billings || []).filter((b: any) => {
        const unitPropId = b.contract?.unit?.property_id;
        return unitPropId === p.id;
      });
      const rentIncome = pBillings
        .filter((b: any) => b.status === "paid")
        .reduce((s: number, b: any) => s + Number(b.total_amount), 0);
      const unpaidAmount = pBillings
        .filter((b: any) => b.status !== "paid")
        .reduce((s: number, b: any) => s + Number(b.total_amount), 0);
      const feeRate = effectiveFeeRate(p.management_fee_rate, p.management_form);
      const managementFee = Math.floor(rentIncome * feeRate / 100);
      const pExpenses = (expenses || []).filter((e: any) => e.property_id === p.id);
      const expenseTotal = pExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
      const netAmount = rentIncome - managementFee - expenseTotal;
      const occupied = units.filter((u: any) => u.status === "occupied").length;

      return {
        name: p.name,
        totalUnits: units.length,
        occupied,
        rentIncome,
        unpaidAmount,
        managementFeeRate: feeRate,
        managementFee,
        expenses: pExpenses.map((e: any) => ({
          description: e.description,
          amount: Number(e.amount),
        })),
        expenseTotal,
        netAmount,
      };
    });

    const totals = {
      rentIncome: propertyReport.reduce((s, p) => s + p.rentIncome, 0),
      managementFee: propertyReport.reduce((s, p) => s + p.managementFee, 0),
      expenseTotal: propertyReport.reduce((s, p) => s + p.expenseTotal, 0),
      netAmount: propertyReport.reduce((s, p) => s + p.netAmount, 0),
      unpaidAmount: propertyReport.reduce((s, p) => s + p.unpaidAmount, 0),
    };

    const html = renderReportHtml(owner.name, month, propertyReport, totals);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json({ error: "レポート生成に失敗しました" }, { status: 500 });
  }
}

interface PropertyReportItem {
  name: string;
  totalUnits: number;
  occupied: number;
  rentIncome: number;
  unpaidAmount: number;
  managementFeeRate: number;
  managementFee: number;
  expenses: { description: string; amount: number }[];
  expenseTotal: number;
  netAmount: number;
}

function renderReportHtml(
  ownerName: string,
  month: string,
  properties: PropertyReportItem[],
  totals: { rentIncome: number; managementFee: number; expenseTotal: number; netAmount: number; unpaidAmount: number }
) {
  const fmt = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
  const [y, m] = month.split("-");

  const propertyRows = properties.map((p) => {
    const expenseRows = p.expenses.length > 0
      ? p.expenses.map((e) => `<tr><td style="padding-left:40px;color:#666;font-size:12px">└ ${e.description}</td><td style="text-align:right;color:#c53030;font-size:12px">-${fmt(e.amount)}</td></tr>`).join("")
      : "";
    return `
      <tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:10px 12px;font-weight:600">${p.name}</td>
        <td style="text-align:center">${p.occupied}/${p.totalUnits}</td>
        <td style="text-align:right">${fmt(p.rentIncome)}</td>
        <td style="text-align:right;color:#c53030">-${fmt(p.managementFee)}<span style="font-size:11px;color:#999"> (${p.managementFeeRate}%)</span></td>
        <td style="text-align:right;color:#c05621">${p.expenseTotal > 0 ? `-${fmt(p.expenseTotal)}` : "—"}</td>
        <td style="text-align:right;font-weight:600;color:#2b6cb0">${fmt(p.netAmount)}</td>
      </tr>
      ${expenseRows}
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>オーナー月次レポート — ${ownerName}（${y}年${m}月）</title>
<style>
  body { font-family: "Helvetica Neue", "Hiragino Kaku Gothic ProN", sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a202c; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: #718096; margin-bottom: 32px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; background: #f7fafc; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; color: #718096; letter-spacing: 0.5px; }
  td { padding: 10px 12px; }
  .total-row td { border-top: 2px solid #1a365d; font-weight: 700; font-size: 14px; padding: 12px; }
  .summary { display: flex; gap: 16px; margin-bottom: 32px; }
  .summary-card { flex: 1; background: #f7fafc; border-radius: 8px; padding: 16px; text-align: center; }
  .summary-label { font-size: 11px; color: #718096; display: block; margin-bottom: 4px; }
  .summary-value { font-size: 22px; font-weight: 700; }
  .footer { margin-top: 40px; font-size: 11px; color: #a0aec0; text-align: center; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <h1>月次収支レポート</h1>
  <p class="subtitle">${ownerName}様　${y}年${Number(m)}月分</p>

  <div class="summary">
    <div class="summary-card">
      <span class="summary-label">家賃収入</span>
      <span class="summary-value" style="color:#2f855a">${fmt(totals.rentIncome)}</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">管理手数料</span>
      <span class="summary-value" style="color:#c53030">-${fmt(totals.managementFee)}</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">経費</span>
      <span class="summary-value" style="color:#c05621">${totals.expenseTotal > 0 ? `-${fmt(totals.expenseTotal)}` : "—"}</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">お振込額</span>
      <span class="summary-value" style="color:#2b6cb0">${fmt(totals.netAmount)}</span>
    </div>
  </div>

  ${totals.unpaidAmount > 0 ? `<p style="background:#fffbeb;border:1px solid #f6e05e;border-radius:6px;padding:10px 14px;font-size:12px;color:#975a16;margin-bottom:24px">⚠ 未入金: ${fmt(totals.unpaidAmount)}（上記の家賃収入には含まれていません）</p>` : ""}

  <table>
    <thead>
      <tr>
        <th>物件</th>
        <th style="text-align:center">稼働</th>
        <th style="text-align:right">家賃収入</th>
        <th style="text-align:right">管理手数料</th>
        <th style="text-align:right">経費</th>
        <th style="text-align:right">差引額</th>
      </tr>
    </thead>
    <tbody>
      ${propertyRows}
      <tr class="total-row">
        <td>合計</td>
        <td></td>
        <td style="text-align:right">${fmt(totals.rentIncome)}</td>
        <td style="text-align:right;color:#c53030">-${fmt(totals.managementFee)}</td>
        <td style="text-align:right;color:#c05621">${totals.expenseTotal > 0 ? `-${fmt(totals.expenseTotal)}` : "—"}</td>
        <td style="text-align:right;color:#2b6cb0">${fmt(totals.netAmount)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    このレポートはRoomlyにより自動生成されました — ${new Date().toISOString().slice(0, 10)}
  </div>
</body>
</html>`;
}
