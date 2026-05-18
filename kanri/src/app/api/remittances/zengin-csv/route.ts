import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateZenginFile } from "@/lib/zengin";

// POST: 全銀フォーマットデータを生成（送金IDリスト or オーナーIDリスト+金額）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { remittance_ids, owner_ids, owner_amounts, transfer_date, sender_name, sender_bank_code, sender_branch_code, sender_account_type, sender_account_number } = body;

    const hasRemittanceIds = remittance_ids && Array.isArray(remittance_ids) && remittance_ids.length > 0;
    const hasOwnerIds = owner_ids && Array.isArray(owner_ids) && owner_ids.length > 0;

    if (!hasRemittanceIds && !hasOwnerIds) {
      return NextResponse.json(
        { error: "送金IDまたはオーナーIDを1件以上指定してください" },
        { status: 400 }
      );
    }

    if (!transfer_date) {
      return NextResponse.json(
        { error: "振込日を指定してください" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let transfers: { bankCode: string; branchCode: string; accountType: string; accountNumber: string; accountHolder: string; amount: number }[] = [];
    const skipped: string[] = [];

    if (hasOwnerIds) {
      const { data: owners, error } = await supabase
        .from("owners")
        .select("id, name, bank_code, bank_branch_code, bank_account_type, bank_account_number, bank_account_holder")
        .in("id", owner_ids);

      if (error || !owners) {
        return NextResponse.json(
          { error: "オーナーデータの取得に失敗しました" },
          { status: 500 }
        );
      }

      transfers = owners
        .filter((o: any) => {
          if (!o.bank_code || !o.bank_branch_code || !o.bank_account_number || !o.bank_account_holder) {
            skipped.push(o.name || o.id);
            return false;
          }
          return true;
        })
        .map((o: any) => ({
          bankCode: o.bank_code,
          branchCode: o.bank_branch_code,
          accountType: o.bank_account_type || "ordinary",
          accountNumber: o.bank_account_number,
          accountHolder: o.bank_account_holder,
          amount: Number(owner_amounts?.[o.id] || 0),
        }))
        .filter((t) => t.amount > 0);
    } else {
      const { data: remittances, error } = await supabase
        .from("owner_remittances")
        .select("*, owner:owners(id, name, bank_code, bank_branch_code, bank_name, bank_branch, bank_account_type, bank_account_number, bank_account_holder)")
        .in("id", remittance_ids);

      if (error || !remittances) {
        return NextResponse.json(
          { error: "送金データの取得に失敗しました" },
          { status: 500 }
        );
      }

      transfers = remittances
        .filter((r: any) => {
          const o = r.owner;
          if (!o?.bank_code || !o?.bank_branch_code || !o?.bank_account_number || !o?.bank_account_holder) {
            skipped.push(o?.name || r.owner_id);
            return false;
          }
          return true;
        })
        .map((r: any) => ({
          bankCode: r.owner.bank_code,
          branchCode: r.owner.bank_branch_code,
          accountType: r.owner.bank_account_type || "ordinary",
          accountNumber: r.owner.bank_account_number,
          accountHolder: r.owner.bank_account_holder,
          amount: Number(r.net_amount),
        }));
    }

    if (transfers.length === 0) {
      return NextResponse.json(
        { error: "振込先情報が不足しているため、出力できる送金がありません", skipped },
        { status: 400 }
      );
    }

    // 振込日をMMDD形式に変換
    const dateObj = new Date(transfer_date);
    const mmdd = String(dateObj.getMonth() + 1).padStart(2, "0") + String(dateObj.getDate()).padStart(2, "0");

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

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="zengin_${transfer_date}.txt"`);

    return new NextResponse(Buffer.from(data), { headers });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
