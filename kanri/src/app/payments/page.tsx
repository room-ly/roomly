import Link from "next/link";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import PageHeader from "@/components/PageHeader";

async function getBatches() {
  const supabase = await createClient();
  const company_id = await getCompanyId();
  const { data } = await supabase
    .from("payment_batches")
    .select("id, batch_date, status, total_amount, executed_at, notes")
    .eq("company_id", company_id)
    .order("batch_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as Record<string, any>[];
}

export default async function PaymentsPage() {
  const batches = await getBatches();

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title="振込"
        em="バッチ"
        description="オーナーへの送金と業者（修理会社等）への費用支払いをまとめた振込バッチを作成し、全銀CSVを出力します。実行済みにすると送金・費用が支払済みになります。"
      />

      <div className="flex justify-end mb-4">
        <Link href="/payments/new" className="btn btn-primary">
          振込バッチを作成
        </Link>
      </div>

      {batches.length === 0 ? (
        <div className="card p-10 text-center text-ink-3">
          振込バッチがありません。「振込バッチを作成」から、振り込む対象を選んでまとめてください。
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
    </>
  );
}
