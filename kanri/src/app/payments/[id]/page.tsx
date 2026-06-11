import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import BatchDetailClient from "@/components/BatchDetailClient";

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const company_id = await getCompanyId();

  const { data: batch } = await supabase
    .from("payment_batches")
    .select("*, items:payment_batch_items(*), sender:company_bank_accounts(label, bank_name, branch_name, account_number, account_holder)")
    .eq("id", id)
    .eq("company_id", company_id)
    .single();
  if (!batch) notFound();

  const items = ((batch as any).items ?? []) as Record<string, any>[];
  const sender = (batch as any).sender as Record<string, any> | null;
  const isExecuted = batch.status === "executed";

  return (
    <>
      <div className="detail-back">
        <Link href="/payments" className="rlink is-muted is-back">← 振込一覧に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">振込バッチ {batch.batch_date}</h1>
            <div className="detail-kana">
              <span className={`charge-tag ${isExecuted ? "accent" : ""}`}>
                {isExecuted ? "振込実行済み" : "下書き"}
              </span>
              {sender?.label ? <span className="ml-2">振込元: {sender.label}</span> : null}
            </div>
          </div>
        </div>
        <div className="detail-header-actions">
          <BatchDetailClient
            batchId={batch.id}
            batchDate={batch.batch_date}
            status={batch.status}
            itemCount={items.length}
          />
        </div>
      </div>

      <div className="cols-summary" style={{ marginBottom: 24, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="sum-card">
          <span className="sum-label mono">合計金額</span>
          <span className="sum-value" style={{ fontSize: 16 }}>¥{Number(batch.total_amount).toLocaleString()}</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">件数</span>
          <span className="sum-value" style={{ fontSize: 16 }}>{items.length}件</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">振込日</span>
          <span className="sum-value" style={{ fontSize: 14 }}>{batch.batch_date}</span>
        </div>
      </div>

      <div className="section">
        <div className="section-head-bar"><h2>振込明細</h2></div>
        <div className="section-body">
          <table className="tbl">
            <thead>
              <tr>
                <th>区分</th>
                <th>受取人</th>
                <th>振込先</th>
                <th style={{ textAlign: "right" }}>金額</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.item_type === "owner_remittance" ? "オーナー送金" : "業者支払い"}</td>
                  <td>{it.recipient_name}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {it.bank_code} {it.branch_code} {it.account_number}
                  </td>
                  <td className="num strong">¥{Number(it.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {batch.notes && (
        <div className="section">
          <div className="section-head-bar"><h2>備考</h2></div>
          <div className="section-body"><p style={{ whiteSpace: "pre-wrap" }}>{batch.notes}</p></div>
        </div>
      )}
    </>
  );
}
