import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { generateZenginFile } from "@/lib/zengin";

// POST: バッチの全銀CSVを生成（明細スナップショットから。draft/executed問わず何度でも再DL可）
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requirePermission("export:csv");
    if (denied) return denied;

    const { id } = await params;
    const supabase = await createClient();
    const company_id = await getCompanyId();

    const { data: batch, error } = await supabase
      .from("payment_batches")
      .select("id, batch_date, items:payment_batch_items(*), sender:company_bank_accounts(bank_code, branch_code, account_type, account_number, account_holder)")
      .eq("id", id)
      .eq("company_id", company_id)
      .single();
    if (error || !batch) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

    const items = ((batch as { items?: Record<string, unknown>[] }).items ?? []);
    if (items.length === 0) {
      return NextResponse.json({ error: "振込明細がありません" }, { status: 400 });
    }

    const sender = (batch as { sender?: Record<string, string> | null }).sender ?? null;

    const transfers = items.map((it) => ({
      bankCode: String(it.bank_code ?? ""),
      branchCode: String(it.branch_code ?? ""),
      accountType: String(it.account_type ?? "ordinary"),
      accountNumber: String(it.account_number ?? ""),
      accountHolder: String(it.account_holder_kana ?? ""),
      amount: Number(it.amount) || 0,
      label: String(it.label ?? ""),
    }));

    const batchDate = (batch as { batch_date: string }).batch_date;
    const dateObj = new Date(batchDate);
    const mmdd =
      String(dateObj.getMonth() + 1).padStart(2, "0") +
      String(dateObj.getDate()).padStart(2, "0");

    const data = generateZenginFile(
      {
        transferDate: mmdd,
        senderBankCode: sender?.bank_code || "    ",
        senderBranchCode: sender?.branch_code || "   ",
        senderAccountType: sender?.account_type || "1",
        senderAccountNumber: sender?.account_number || "0000000",
        senderName: sender?.account_holder || "",
      },
      transfers,
    );

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="zengin_${batchDate}.txt"`);
    return new NextResponse(Buffer.from(data), { headers });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
