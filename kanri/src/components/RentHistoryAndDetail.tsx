"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import RentDetailClient from "./RentDetailClient";

const paymentMethodLabels: Record<string, string> = {
  transfer: "銀行振込",
  card: "クレジットカード",
  cash: "現金",
  debit: "口座引落",
  refund: "返金",
};

function formatBillingMonth(s: string | null | undefined): string {
  if (!s) return "—";
  return s.slice(0, 7);
}

function deriveStatus(b: any): string {
  const total = Number(b.total_amount) || 0;
  const paid = (b.rent_payments ?? []).reduce(
    (s: number, p: any) => s + Number(p.amount || 0),
    0
  );
  if (paid >= total) return "paid";
  if (paid > 0) return "partial";
  const todayStr = new Date().toISOString().slice(0, 10);
  if (b.due_date && b.due_date < todayStr) return "overdue";
  return "unpaid";
}

interface Props {
  history: any[];
  initialId: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
}

const INITIAL_LIMIT = 12;

export default function RentHistoryAndDetail({
  history,
  initialId,
  tenantName,
  propertyName,
  unitNumber,
}: Props) {
  const [selectedId, setSelectedId] = useState(initialId);
  const [showAll, setShowAll] = useState(history.length <= INITIAL_LIMIT);

  const current = history.find((b) => b.id === selectedId) ?? history[0];
  const currentPayments = current?.rent_payments ?? [];
  const currentPaidTotal = currentPayments.reduce(
    (s: number, p: any) => s + Number(p.amount || 0),
    0
  );
  const currentRemaining = Number(current?.total_amount ?? 0) - currentPaidTotal;
  const currentStatus = deriveStatus(current);

  const displayedHistory = showAll ? history : history.slice(0, INITIAL_LIMIT);

  return (
    <>
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
              </tr>
            </thead>
            <tbody>
              {displayedHistory.map((b: any) => {
                const paid = (b.rent_payments ?? []).reduce(
                  (s: number, p: any) => s + Number(p.amount || 0),
                  0
                );
                const isCurrent = b.id === selectedId;
                const derivedStatus = deriveStatus(b);
                return (
                  <tr
                    key={b.id}
                    className={`row-hover ${
                      derivedStatus === "overdue"
                        ? "row-overdue"
                        : isCurrent
                          ? "row-current"
                          : ""
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedId(b.id)}
                  >
                    <td>
                      <span style={isCurrent ? { fontWeight: 600 } : undefined}>
                        {formatBillingMonth(b.billing_month)}
                      </span>
                      {isCurrent && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: "var(--accent)" }}>●</span>
                      )}
                    </td>
                    <td className="num">¥{Number(b.total_amount).toLocaleString()}</td>
                    <td className="num">
                      <span
                        style={{
                          color: paid > 0 ? "var(--accent-deep)" : "var(--ink-3)",
                          fontWeight: paid > 0 ? 500 : 400,
                        }}
                      >
                        ¥{paid.toLocaleString()}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {b.due_date}
                    </td>
                    <td>
                      <StatusBadge status={derivedStatus} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!showAll && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="rlink"
                style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer" }}
              >
                もっと見る（残り{history.length - INITIAL_LIMIT}件）
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 選択月の詳細 */}
      {current && (
        <div className="section">
          <div className="section-head-bar">
            <h2>{formatBillingMonth(current.billing_month)} の詳細</h2>
            <StatusBadge status={currentStatus} />
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
                <span
                  style={{
                    fontWeight: 500,
                    color:
                      currentRemaining > 0
                        ? "var(--warn)"
                        : currentRemaining < 0
                          ? "#2b6cb0"
                          : "var(--accent-deep)",
                  }}
                >
                  {currentRemaining > 0
                    ? `残 ¥${currentRemaining.toLocaleString()}`
                    : currentRemaining < 0
                      ? `超過 ¥${Math.abs(currentRemaining).toLocaleString()}`
                      : "完済"}
                </span>
              </div>
              <div style={{ height: 8, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    background:
                      currentRemaining > 0
                        ? "var(--warn)"
                        : currentRemaining < 0
                          ? "#2b6cb0"
                          : "var(--accent-deep)",
                    width: `${Math.min(100, (currentPaidTotal / Number(current.total_amount)) * 100)}%`,
                    transition: "width 0.3s",
                  }}
                />
              </div>
              {currentRemaining < 0 && (
                <p style={{ fontSize: 11, color: "#2b6cb0", marginTop: 4 }}>
                  請求額 ¥{Number(current.total_amount).toLocaleString()} に対して ¥
                  {Math.abs(currentRemaining).toLocaleString()} 多く入金されています。返金または翌月充当の確認をしてください。
                </p>
              )}
            </div>

            {/* 入金履歴 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>入金履歴</h3>
              {(currentStatus !== "paid" || currentRemaining < 0) && (
                <RentDetailClient
                  billing={{
                    id: current.id,
                    total_amount: Number(current.total_amount),
                    paid_amount: currentPaidTotal,
                    tenant_name: tenantName,
                    unit_label: `${propertyName} ${unitNumber}`,
                    billing_month: current.billing_month,
                  }}
                  showRefund={currentRemaining < 0}
                />
              )}
            </div>
            {currentPayments.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "16px 0" }}>
                入金記録はありません
              </p>
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
                  {[...currentPayments]
                    .sort((a: any, b: any) => (a.payment_date > b.payment_date ? -1 : 1))
                    .map((p: any) => {
                      const isRefund = p.payment_method === "refund" || Number(p.amount) < 0;
                      return (
                        <tr key={p.id} style={isRefund ? { background: "#eff6ff" } : undefined}>
                          <td className="mono" style={{ fontSize: 12 }}>
                            {p.payment_date}
                          </td>
                          <td style={isRefund ? { color: "#2b6cb0", fontWeight: 500 } : undefined}>
                            {paymentMethodLabels[p.payment_method] || p.payment_method}
                          </td>
                          <td
                            className="num"
                            style={{ fontWeight: 500, color: isRefund ? "#2b6cb0" : undefined }}
                          >
                            {isRefund
                              ? `-¥${Math.abs(Number(p.amount)).toLocaleString()}`
                              : `¥${Number(p.amount).toLocaleString()}`}
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
      )}
    </>
  );
}
