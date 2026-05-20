import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { getRentBillingDetail } from "@/lib/queries";
import { formatPhone } from "@/lib/phone";
import StatusBadge from "@/components/StatusBadge";
import RentDetailClient from "@/components/RentDetailClient";

const paymentMethodLabels: Record<string, string> = {
  transfer: "銀行振込",
  card: "クレジットカード",
  cash: "現金",
  debit: "口座引落",
  refund: "返金",
};

export default async function RentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRentBillingDetail(id);
  if (!result) notFound();

  const { current, history } = "current" in result
    ? result
    : { current: result, history: [result] };

  const tenant = current.contract?.tenant;
  const unit = current.contract?.unit;
  const property = unit?.property;

  const currentPayments = current.rent_payments || [];
  const currentPaidTotal = currentPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const currentRemaining = Number(current.total_amount) - currentPaidTotal;

  const totalBilled = history.reduce((s: number, b: any) => s + Number(b.total_amount), 0);
  const totalPaid = history.reduce((s: number, b: any) => {
    const payments = b.rent_payments || [];
    return s + payments.reduce((ps: number, p: any) => ps + Number(p.amount), 0);
  }, 0);

  return (
    <>
      <div className="detail-back">
        <Link href="/rent" className="rlink is-muted is-back">← 家賃管理に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">{property?.name} {unit?.unit_number}</h1>
            <div className="detail-kana">{tenant?.name} — 家賃履歴</div>
          </div>
        </div>
      </div>

      {/* サマリー */}
      <div className="cols-summary" style={{ marginBottom: 24 }}>
        <div className="sum-card">
          <span className="sum-label mono">請求累計</span>
          <span className="sum-value serif-i">¥{totalBilled.toLocaleString()}</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">入金累計</span>
          <span className="sum-value serif-i" style={{ color: "var(--accent-deep)" }}>¥{totalPaid.toLocaleString()}</span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">請求回数</span>
          <span className="sum-value serif-i">{history.length}</span>
          <span className="sum-foot mono">ヶ月</span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          {/* 月別家賃履歴 */}
          <div className="section">
            <div className="section-head-bar">
              <h2>月別家賃履歴</h2>
              <span className="desc">{history.length}件</span>
            </div>
            <div className="section-body flush">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>対象月</th>
                    <th style={{ textAlign: "right" }}>請求額</th>
                    <th style={{ textAlign: "right" }}>入金額</th>
                    <th>支払期限</th>
                    <th>状態</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((b: any) => {
                    const payments = b.rent_payments || [];
                    const paid = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
                    const isCurrent = b.id === id;
                    return (
                      <tr
                        key={b.id}
                        className={`row-hover ${b.status === "overdue" ? "bg-danger-tint" : ""}`}
                        style={isCurrent ? { background: "var(--accent-tint)" } : undefined}
                      >
                        <td>
                          <span style={isCurrent ? { fontWeight: 600 } : undefined}>{b.billing_month}</span>
                          {isCurrent && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--accent)" }}>●</span>}
                        </td>
                        <td className="num">¥{Number(b.total_amount).toLocaleString()}</td>
                        <td className="num">
                          <span style={{ color: paid > 0 ? "var(--accent-deep)" : "var(--ink-3)", fontWeight: paid > 0 ? 500 : 400 }}>
                            ¥{paid.toLocaleString()}
                          </span>
                        </td>
                        <td className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{b.due_date}</td>
                        <td><StatusBadge status={b.status} /></td>
                        <td>
                          {b.status !== "paid" && (
                            <Link href={`/rent/${b.id}`} className="rlink" style={{ fontSize: 11 }}>詳細</Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 選択月の詳細 */}
          <div className="section">
            <div className="section-head-bar">
              <h2>{current.billing_month} の詳細</h2>
              <StatusBadge status={current.status} />
            </div>
            <div className="section-body">
              {/* 請求内訳 */}
              <div className="cfee-grid">
                <div className="cfee-main">
                  <div className="cfee-label mono">請求合計</div>
                  <div className="cfee-value">¥{Number(current.total_amount).toLocaleString()}</div>
                </div>
                <div className="cfee-item">
                  <div className="cfee-label mono">賃料</div>
                  <div className="cfee-sub num">¥{Number(current.rent).toLocaleString()}</div>
                </div>
                <div className="cfee-item">
                  <div className="cfee-label mono">管理費</div>
                  <div className="cfee-sub num">¥{Number(current.management_fee).toLocaleString()}</div>
                </div>
                {Number(current.other_amount) > 0 && (
                  <div className="cfee-item">
                    <div className="cfee-label mono">{current.other_description || "その他"}</div>
                    <div className="cfee-sub num">¥{Number(current.other_amount).toLocaleString()}</div>
                  </div>
                )}
              </div>

              {/* 入金バー */}
              <div style={{ marginTop: 20, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--ink-3)" }}>入金済 ¥{currentPaidTotal.toLocaleString()}</span>
                  <span style={{ fontWeight: 500, color: currentRemaining > 0 ? "var(--warn)" : currentRemaining < 0 ? "#2b6cb0" : "var(--accent-deep)" }}>
                    {currentRemaining > 0
                      ? `残 ¥${currentRemaining.toLocaleString()}`
                      : currentRemaining < 0
                        ? `超過 ¥${Math.abs(currentRemaining).toLocaleString()}`
                        : "完済"}
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    borderRadius: 99,
                    background: currentRemaining > 0 ? "var(--warn)" : currentRemaining < 0 ? "#2b6cb0" : "var(--accent-deep)",
                    width: `${Math.min(100, (currentPaidTotal / Number(current.total_amount)) * 100)}%`,
                    transition: "width 0.3s",
                  }} />
                </div>
                {currentRemaining < 0 && (
                  <p style={{ fontSize: 11, color: "#2b6cb0", marginTop: 4 }}>
                    請求額 ¥{Number(current.total_amount).toLocaleString()} に対して ¥{Math.abs(currentRemaining).toLocaleString()} 多く入金されています。返金または翌月充当の確認をしてください。
                  </p>
                )}
              </div>

              {/* 入金履歴 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>入金履歴</h3>
                {(current.status !== "paid" || currentRemaining < 0) && (
                  <RentDetailClient
                    billing={{
                      id: current.id,
                      total_amount: Number(current.total_amount),
                      paid_amount: currentPaidTotal,
                      tenant_name: tenant?.name || "—",
                      unit_label: `${property?.name || ""} ${unit?.unit_number || ""}`,
                      billing_month: current.billing_month,
                    }}
                    showRefund={currentRemaining < 0}
                  />
                )}
              </div>
              {currentPayments.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "16px 0" }}>入金記録はありません</p>
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>入金日</th>
                      <th>方法</th>
                      <th style={{ textAlign: "right" }}>金額</th>
                      <th>備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPayments
                      .sort((a: any, b: any) => (a.payment_date > b.payment_date ? -1 : 1))
                      .map((p: any) => {
                        const isRefund = p.payment_method === "refund" || Number(p.amount) < 0;
                        return (
                          <tr key={p.id} style={isRefund ? { background: "#eff6ff" } : undefined}>
                            <td className="mono" style={{ fontSize: 12 }}>{p.payment_date}</td>
                            <td style={isRefund ? { color: "#2b6cb0", fontWeight: 500 } : undefined}>
                              {paymentMethodLabels[p.payment_method] || p.payment_method}
                            </td>
                            <td className="num" style={{ fontWeight: 500, color: isRefund ? "#2b6cb0" : undefined }}>
                              {isRefund ? `-¥${Math.abs(Number(p.amount)).toLocaleString()}` : `¥${Number(p.amount).toLocaleString()}`}
                            </td>
                            <td style={{ color: "var(--ink-3)" }}>{p.notes || "—"}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* サイドカラム */}
        <div className="detail-col-side">
          <div className="section">
            <div className="section-head-bar"><h2>入居者情報</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">氏名</div>
                  <div className="field-value">
                    <Link href={`/tenants/${tenant?.id}`} className="rlink">{tenant?.name || "—"}</Link>
                  </div>
                </div>
                {tenant?.phone && (
                  <div className="field">
                    <div className="field-label mono">電話番号</div>
                    <div className="field-value">
                      <a href={`tel:${tenant.phone}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Phone size={13} /> <span className="mono">{formatPhone(tenant.phone)}</span>
                      </a>
                    </div>
                  </div>
                )}
                {tenant?.email && (
                  <div className="field">
                    <div className="field-label mono">メール</div>
                    <div className="field-value">
                      <a href={`mailto:${tenant.email}`} className="rlink" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Mail size={13} /> {tenant.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-head-bar"><h2>物件情報</h2></div>
            <div className="section-body">
              <div className="kv-list">
                <div className="field">
                  <div className="field-label mono">物件</div>
                  <div className="field-value">
                    <Link href={`/properties/${property?.id}`} className="rlink">{property?.name || "—"}</Link>
                  </div>
                </div>
                {property?.address && (
                  <div className="field">
                    <div className="field-label mono">住所</div>
                    <div className="field-value field-plain" style={{ fontSize: 12 }}>{property.address}</div>
                  </div>
                )}
                <div className="field">
                  <div className="field-label mono">部屋</div>
                  <div className="field-value field-plain mono">{unit?.unit_number || "—"}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
