import Link from "next/link";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import PageHeader from "@/components/PageHeader";
import { getBatchCandidates, getUnconfirmedOwnerCandidates } from "@/lib/payment-batch-service";
import NewBatchClient from "@/components/NewBatchClient";

// 対象月（YYYY-MM-01）。未指定なら当月。
function resolveMonth(monthParam?: string): string {
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) return `${monthParam}-01`;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

async function getData(month: string) {
  const supabase = await createClient();
  const company_id = await getCompanyId();
  const [{ remittances, expenses }, { candidates: unconfirmedOwners, summary }, { data: banks }, { data: payees }, { data: batches }] =
    await Promise.all([
      getBatchCandidates(supabase, company_id),
      getUnconfirmedOwnerCandidates(supabase, company_id, month),
      supabase
        .from("company_bank_accounts")
        .select("id, label, account_holder, is_default")
        .eq("company_id", company_id)
        .order("is_default", { ascending: false }),
      // 行内で支払先を設定するための選択肢（口座情報の有無も判定に使う）
      supabase
        .from("payees")
        .select("id, name, bank_code, branch_code, account_number, account_holder_kana")
        .eq("company_id", company_id)
        .order("name"),
      supabase
        .from("payment_batches")
        .select("id, batch_date, status, total_amount, executed_at, notes")
        .eq("company_id", company_id)
        .order("batch_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
  return {
    remittances,
    expenses,
    unconfirmedOwners,
    summary,
    banks: (banks ?? []) as Record<string, any>[],
    payees: (payees ?? []) as Record<string, any>[],
    batches: (batches ?? []) as Record<string, any>[],
  };
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = resolveMonth(monthParam);
  const { remittances, expenses, unconfirmedOwners, summary, banks, payees, batches } = await getData(month);

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title="振込バッチを作成"
        em="対象を選択"
        description="オーナーへの送金と業者（修理会社等）への費用支払いから、振り込む対象を選んでバッチにまとめ、全銀CSVを出力します。支払先が未設定の費用は、その場で支払先を設定すると選べるようになります。"
      />

      <NewBatchClient
        remittances={remittances}
        expenses={expenses}
        unconfirmedOwners={unconfirmedOwners}
        summary={summary}
        month={month.slice(0, 7)}
        banks={banks}
        payees={payees as any}
      />

      {/* 過去の振込バッチ */}
      <div className="mt-10">
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="eyebrow mono">History</span>
            <h2 className="text-base font-semibold mt-0.5">過去の振込バッチ</h2>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="card p-8 text-center text-ink-3 text-sm">
            まだ振込バッチはありません。上で対象を選んで作成すると、ここに履歴が残ります。
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-ink-3 text-xs">
                    <th className="text-left px-4 py-3 font-medium">振込日</th>
                    <th className="text-left px-4 py-3 font-medium">ステータス</th>
                    <th className="text-right px-4 py-3 font-medium">合計金額</th>
                    <th className="text-left px-4 py-3 font-medium">備考</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/payments/${b.id}`} className="rlink font-medium">
                          {b.batch_date}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`charge-tag ${b.status === "executed" ? "accent" : ""}`}>
                          {b.status === "executed" ? "振込実行済み" : "下書き"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ¥{Number(b.total_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-ink-3">{b.notes ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
