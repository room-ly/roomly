import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { generateZenginFile } from "@/lib/zengin";

// POST: オーナー送金 + 経費（payee付き）を統合した全銀CSVを生成
// body: {
//   remittance_ids?: string[]   // オーナー送金ID
//   expense_ids?: string[]      // 経費ID（payee_idが必要）
//   transfer_date: string       // YYYY-MM-DD
//   sender_name: string
//   sender_bank_code?: string
//   sender_branch_code?: string
//   sender_account_type?: string
//   sender_account_number?: string
// }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      remittance_ids,
      expense_ids,
      transfer_date,
      sender_name,
      sender_bank_code,
      sender_branch_code,
      sender_account_type,
      sender_account_number,
    } = body;

    if (!transfer_date) {
      return NextResponse.json({ error: "振込日を指定してください" }, { status: 400 });
    }

    const hasRemittances = Array.isArray(remittance_ids) && remittance_ids.length > 0;
    const hasExpenses = Array.isArray(expense_ids) && expense_ids.length > 0;

    if (!hasRemittances && !hasExpenses) {
      return NextResponse.json({ error: "送金IDまたは費用IDを1件以上指定してください" }, { status: 400 });
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();

    const transfers: {
      bankCode: string;
      branchCode: string;
      accountType: string;
      accountNumber: string;
      accountHolder: string;
      amount: number;
      label: string;
    }[] = [];
    const skipped: string[] = [];
    // CSVに実際に含めた費用ID（口座不足でskipしたものは除く）。出力成功後に paid_at を記録する
    const paidExpenseIds: string[] = [];

    // オーナー送金
    if (hasRemittances) {
      const { data: remittances, error } = await supabase
        .from("owner_remittances")
        .select("*, owner:owners(id, name, bank_code, bank_branch_code, bank_account_type, bank_account_number, bank_account_holder)")
        .in("id", remittance_ids)
        .eq("company_id", company_id);

      if (error) throw error;

      for (const r of remittances ?? []) {
        const o = r.owner as Record<string, any> | null;
        if (!o?.bank_code || !o?.bank_branch_code || !o?.bank_account_number || !o?.bank_account_holder) {
          skipped.push(`オーナー: ${o?.name ?? r.owner_id}（口座情報不足）`);
          continue;
        }
        transfers.push({
          bankCode: o.bank_code,
          branchCode: o.bank_branch_code,
          accountType: o.bank_account_type || "ordinary",
          accountNumber: o.bank_account_number,
          accountHolder: o.bank_account_holder,
          amount: Number(r.net_amount),
          label: `オーナー送金: ${o.name}`,
        });
      }
    }

    // 経費（payee付き）
    if (hasExpenses) {
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("*, payee:payees(id, name, bank_code, branch_code, account_type, account_number, account_holder_kana)")
        .in("id", expense_ids)
        .eq("company_id", company_id);

      if (error) throw error;

      for (const e of expenses ?? []) {
        const p = e.payee as Record<string, any> | null;
        if (!p) {
          skipped.push(`費用: ${e.description}（支払先未設定）`);
          continue;
        }
        if (!p.bank_code || !p.branch_code || !p.account_number || !p.account_holder_kana) {
          skipped.push(`費用: ${e.description}（${p.name} の口座情報不足）`);
          continue;
        }
        transfers.push({
          bankCode: p.bank_code,
          branchCode: p.branch_code,
          accountType: p.account_type || "ordinary",
          accountNumber: p.account_number,
          accountHolder: p.account_holder_kana,
          amount: Number(e.amount),
          label: `費用: ${e.description}`,
        });
        paidExpenseIds.push(e.id as string);
      }
    }

    if (transfers.length === 0) {
      return NextResponse.json(
        { error: "出力できる振込データがありません", skipped },
        { status: 400 }
      );
    }

    const dateObj = new Date(transfer_date);
    const mmdd =
      String(dateObj.getMonth() + 1).padStart(2, "0") +
      String(dateObj.getDate()).padStart(2, "0");

    const data = generateZenginFile(
      {
        transferDate: mmdd,
        senderBankCode: sender_bank_code || "    ",
        senderBranchCode: sender_branch_code || "   ",
        senderAccountType: sender_account_type || "1",
        senderAccountNumber: sender_account_number || "0000000",
        senderName: sender_name || "",
      },
      transfers
    );

    // CSVに含めた費用を「支払済み」にして二重振込を防ぐ。
    // 既に paid_at が入っているもの（別経路で支払済み）は上書きしない。
    if (paidExpenseIds.length > 0) {
      await supabase
        .from("expenses")
        .update({ paid_at: transfer_date })
        .in("id", paidExpenseIds)
        .eq("company_id", company_id)
        .is("paid_at", null);
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="zengin_${transfer_date}.txt"`);

    return new NextResponse(Buffer.from(data), { headers });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
