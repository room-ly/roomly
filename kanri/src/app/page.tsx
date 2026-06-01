import {
  Banknote,
  Wrench,
  FileText,
  Receipt,
  Send,
} from "lucide-react";
import Link from "next/link";
import { getDashboardData, getMonthlyTrend } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import { deriveBillingStatus } from "@/lib/billing-status";
import { Sparkline, Donut } from "@/components/MiniViz";

export default async function DashboardPage() {
  const [dashData, monthlyTrend] = await Promise.all([
    getDashboardData(),
    getMonthlyTrend(),
  ]);
  const {
    stats: s,
    overdueBillings,
    activeCases,
    expiringContracts,
    maintenanceUnits,
    vacantUnits,
  } = dashData;

  const now = new Date();
  const expiringWithDays = expiringContracts.map((c: Record<string, any>) => {
    const diff = Math.ceil(
      (new Date(c.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { ...c, remainingDays: diff };
  });

  const dateStr = now.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });

  const priorities = [
    s.overdue_count > 0 && {
      icon: Banknote,
      tone: "danger" as const,
      title: `家賃滞納 ${s.overdue_count}件`,
      detail: `合計 ¥${s.overdue_amount.toLocaleString()} — 早急に督促が必要`,
      href: "/rent?status=overdue",
      action: "滞納一覧",
    },
    s.alert_cases > 0 && {
      icon: Wrench,
      tone: "warn" as const,
      title: `対応案件 要対応 ${s.alert_cases}件`,
      detail: "緊急、または3日以上放置されている案件",
      href: "/cases?filter=open",
      action: "対応案件一覧",
    },
    (s.expiring_contracts > 0 || s.pending_move_outs > 0) && {
      icon: FileText,
      tone: "warn" as const,
      title: `契約対応 ${s.expiring_contracts + s.pending_move_outs}件`,
      detail: [
        s.expiring_contracts > 0 && `満了間近 ${s.expiring_contracts}件`,
        s.pending_move_outs > 0 && `退去申請 ${s.pending_move_outs}件`,
      ].filter(Boolean).join("・"),
      href: "/contracts?filter=expiring",
      action: "契約一覧",
    },
  ].filter(Boolean) as Array<{
    icon: typeof Banknote;
    tone: "danger" | "warn" | "info";
    title: string;
    detail: string;
    href: string;
    action: string;
  }>;

  const collectionPct = s.collection_rate;
  const totalRentExpected = s.total_rent_expected || 0;
  const totalRentReceived = s.total_rent_received || 0;

  // サマリーカードのミニグラフ用データ
  const expenseSeries = monthlyTrend.map((m: Record<string, any>) => Number(m.expenseAmount || 0));
  const hasExpenseTrend = expenseSeries.filter((v: number) => v > 0).length >= 2;
  // 今月の未収（請求のうち未入金）。回収進捗 = 入金/請求 をドーナツで表す
  const unpaidAmount = s.total_rent_unpaid || 0;
  const collectedPct = totalRentExpected > 0 ? Math.round((totalRentReceived / totalRentExpected) * 100) : 100;

  return (
    <>
      {/* Hero + Pulse */}
      <div className="dash2-hero">
        <div className="dash2-hero-greet">
          <div className="dash2-hero-eyebrow mono">{dateStr}</div>
          <h1 className="dash2-hero-title">
            本日の<em style={{ fontStyle: "normal", color: "var(--accent-deep)" }}>管理状況</em>
          </h1>
          <p className="dash2-hero-sub">
            {s.total_properties}棟 {s.total_units}戸を管理中
            {priorities.length > 0 && ` — ${priorities.length}件の対応が必要です`}
          </p>
        </div>

        <div className="dash2-hero-pulse">
          <div className="dash2-pulse-row">
            <span className="dash2-pulse-label mono">今月の回収</span>
            <span className="dash2-pulse-pct mono">{collectionPct}%</span>
          </div>
          <div className="dash2-pulse-amount">
            <span className="num" style={{ fontSize: 26, fontWeight: 600, color: "var(--bg)" }}>
              ¥{totalRentReceived.toLocaleString()}
            </span>
          </div>
          <div className="dash2-pulse-bar">
            <div className="dash2-pulse-bar-fill" style={{ width: `${Math.min(collectionPct, 100)}%` }} />
          </div>
          <div className="dash2-pulse-foot">
            <span>
              請求 <span className="mono" style={{ color: "var(--bg)", fontWeight: 600 }}>¥{totalRentExpected.toLocaleString()}</span>
            </span>
            {s.overdue_count > 0 && (
              <span style={{ color: "var(--danger)" }}>
                滞納 {s.overdue_count}件 / ¥{s.overdue_amount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 経費・送金サマリー */}
      <div className="cols-summary" style={{ marginBottom: 20 }}>
        <div className="sum-card sum-card-graph">
          <div className="sum-main">
            <span className="sum-label mono">入居率</span>
            <span className="sum-value serif-i">{s.occupancy_rate}%</span>
            <span className="sum-foot mono">{s.occupied_units}/{s.total_units}戸</span>
          </div>
          <div className="sum-viz">
            <Donut percent={s.occupancy_rate} id="donut-occ" />
          </div>
        </div>
        <div className="sum-card sum-card-graph">
          <div className="sum-main">
            <span className="sum-label mono">今月の経費</span>
            <span className="sum-value" style={{ fontSize: 16 }}>
              <Link href="/expenses" className="rlink">¥{s.monthly_expenses.toLocaleString()}</Link>
            </span>
            <span className="sum-foot mono">直近{monthlyTrend.length}ヶ月の推移</span>
          </div>
          {hasExpenseTrend && (
            <div className="sum-viz">
              <Sparkline values={expenseSeries} id="spark-exp" />
            </div>
          )}
        </div>
        <div className="sum-card">
          <span className="sum-label mono">未送金</span>
          <span className="sum-value" style={{ fontSize: 16 }}>
            <Link href="/remittances" className="rlink">
              {s.pending_remittances > 0 ? `${s.pending_remittances}件` : "—"}
            </Link>
          </span>
        </div>
        <div className="sum-card sum-card-graph">
          <div className="sum-main">
            <span className="sum-label mono">今月の未収</span>
            <span className="sum-value" style={{ fontSize: 16 }}>
              {unpaidAmount > 0 ? (
                <Link href="/rent" className="rlink">¥{unpaidAmount.toLocaleString()}</Link>
              ) : "¥0"}
            </span>
            <span className="sum-foot mono">回収 {collectedPct}% · 請求¥{totalRentExpected.toLocaleString()}</span>
          </div>
          {totalRentExpected > 0 && (
            <div className="sum-viz">
              <Donut
                percent={collectedPct}
                id="donut-unpaid"
                from={unpaidAmount > 0 ? "var(--warn)" : "var(--viz-grad-from)"}
                to={unpaidAmount > 0 ? "#e0a857" : "var(--viz-grad-to)"}
              />
            </div>
          )}
        </div>
      </div>

      {/* Priorities */}
      {priorities.length > 0 && (
        <div className="dash2-section">
          <div className="dash2-section-head">
            <h2 className="dash2-section-title">
              要対応<span className="dash2-section-title-sub">{priorities.length}件</span>
            </h2>
          </div>
          <div className="dash2-priorities">
            {priorities.map((p) => (
              <Link key={p.href} href={p.href} className="dash2-priority">
                <div className={`dash2-priority-icon ${p.tone}`}>
                  <p.icon size={18} />
                </div>
                <div className="dash2-priority-body">
                  <div className="dash2-priority-title">{p.title}</div>
                  <div className="dash2-priority-detail">{p.detail}</div>
                </div>
                <span className="dash2-priority-action">
                  {p.action} <span className="dash2-priority-arrow">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      {monthlyTrend.length > 0 && (() => {
        // 家賃回収率は「100%が正常・それ以外は取りこぼし」という性質のため、
        // 可変の目標値は設けず100%を基準線とする。100%未満の月は未回収=要注意。
        const fullCount = monthlyTrend.filter((m: Record<string, any>) => m.collectionRate >= 100).length;
        return (
        <div className="dash2-section">
          <div className="dash2-section-head">
            <h2 className="dash2-section-title">
              家賃回収率<span className="dash2-section-title-sub">月次推移</span>
            </h2>
            <div className="dash2-chart-legend">
              <span className="legend-item"><span className="legend-dot" style={{ background: "var(--accent)" }} /> 全額回収</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: "var(--warn)" }} /> 未回収あり</span>
            </div>
          </div>
          <div className="dash2-chart">
            <div className="dash2-chart-axis">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            <div className="dash2-chart-area">
              {/* 100%の基準線。棒の前面(z-index)に描き、満額の月でも常に見える */}
              <div className="dash2-chart-target">
                <span className="dash2-chart-target-label mono">100%</span>
              </div>
              <div className="dash2-chart-bars">
                {monthlyTrend.map((m: Record<string, any>, i: number) => {
                  const isLast = i === monthlyTrend.length - 1;
                  const achieved = m.collectionRate >= 100;
                  return (
                    <div key={m.month} className="dash2-chart-bar-col">
                      <span className={`dash2-chart-val mono${isLast ? " is-last" : ""}`}>
                        {m.collectionRate}%
                      </span>
                      <div
                        className={`dash2-chart-bar${isLast ? " is-last" : ""}${achieved ? " is-achieved" : " is-below"}`}
                        style={{ height: `${m.collectionRate}%` }}
                      >
                        {/* ホバー時に金額の内訳を表示 */}
                        <div className="dash2-chart-tip">
                          <div className="dash2-chart-tip-title mono">{m.label}</div>
                          <div className="dash2-chart-tip-row">
                            <span>回収率</span>
                            <span className="mono" style={{ color: achieved ? "var(--accent)" : "var(--warn)" }}>{m.collectionRate}%</span>
                          </div>
                          <div className="dash2-chart-tip-row">
                            <span>入金</span>
                            <span className="mono">¥{Number(m.paidAmount).toLocaleString()}</span>
                          </div>
                          <div className="dash2-chart-tip-row">
                            <span>請求</span>
                            <span className="mono">¥{Number(m.totalAmount).toLocaleString()}</span>
                          </div>
                          {m.totalAmount - m.paidAmount > 0 && (
                            <div className="dash2-chart-tip-row">
                              <span>未回収</span>
                              <span className="mono" style={{ color: "var(--danger)" }}>¥{Number(m.totalAmount - m.paidAmount).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`dash2-chart-label mono${isLast ? " is-last" : ""}`}>
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="dash2-chart-foot">
            直近{monthlyTrend.length}ヶ月のうち <strong>{fullCount}ヶ月</strong> が全額回収（100%）
          </p>
        </div>
        );
      })()}

      {/* Pipeline */}
      <div className="dash2-section">
        <div className="dash2-section-head">
          <h2 className="dash2-section-title">
            退去・空室<span className="dash2-section-title-sub">パイプライン</span>
          </h2>
        </div>
        <div className="dash2-pipeline">
          <div className="dash2-pipe-col">
            <div className="dash2-pipe-head">
              <span className="tag warn">退去予定</span>
              <span className="dash2-pipe-count mono">{expiringWithDays.length}</span>
            </div>
            {expiringWithDays.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "center", padding: "12px 0" }}>該当なし</p>
            ) : (
              expiringWithDays.map((c: Record<string, any>) => (
                <Link key={c.id} href={`/contracts/${c.id}`} className="dash2-pipe-item">
                  <span className="dash2-pipe-name">{c.unit?.property?.name} {c.unit?.unit_number}</span>
                  <span className="dash2-pipe-sub">{c.tenant?.name}</span>
                  <span className={`dash2-pipe-foot mono ${c.remainingDays <= 30 ? "danger-ink" : "warn-ink"}`}>
                    あと{c.remainingDays}日 · {c.end_date}
                  </span>
                </Link>
              ))
            )}
          </div>

          <div className="dash2-pipe-col">
            <div className="dash2-pipe-head">
              <span className="tag info">原状回復中</span>
              <span className="dash2-pipe-count mono">{maintenanceUnits.length}</span>
            </div>
            {maintenanceUnits.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "center", padding: "12px 0" }}>該当なし</p>
            ) : (
              maintenanceUnits.map((u: Record<string, any>) => (
                <Link key={u.id} href={`/properties/${u.property_id}/units/${u.id}`} className="dash2-pipe-item">
                  <span className="dash2-pipe-name">{u.property?.name} {u.unit_number}</span>
                  <span className="dash2-pipe-sub mono">¥{Number(u.rent).toLocaleString()}/月</span>
                </Link>
              ))
            )}
          </div>

          <div className="dash2-pipe-col">
            <div className="dash2-pipe-head">
              <span className="tag accent">募集中</span>
              <span className="dash2-pipe-count mono">{vacantUnits.length}</span>
            </div>
            {vacantUnits.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "center", padding: "12px 0" }}>該当なし</p>
            ) : (
              vacantUnits.map((u: Record<string, any>) => (
                <Link key={u.id} href={`/properties/${u.property_id}/units/${u.id}`} className="dash2-pipe-item">
                  <span className="dash2-pipe-name">{u.property?.name} {u.unit_number}</span>
                  <span className="dash2-pipe-sub mono">¥{Number(u.rent).toLocaleString()}/月</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Tables */}
      <div className="dash2-tables">
        <div className="dash2-table">
          <div className="dash2-table-head">
            <h3 className="dash2-table-title">滞納一覧</h3>
            <div className="dash2-table-meta">
              {s.overdue_count > 0 && (
                <span className="badge badge-danger mono">{s.overdue_count}件 / ¥{s.overdue_amount.toLocaleString()}</span>
              )}
              <Link href="/rent?status=overdue" className="rlink is-muted" style={{ fontSize: 11 }}>すべて見る</Link>
            </div>
          </div>
          {overdueBillings.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "24px 0" }}>滞納なし</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>入居者</th>
                  <th>対象月</th>
                  <th style={{ textAlign: "right" }}>金額</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {overdueBillings.slice(0, 10).map((b: Record<string, any>) => {
                  const href = `/rent/${b.id}`;
                  return (
                    <tr key={b.id} className="row-hover row-link">
                      <td><Link href={href} className="strong">{b.contract?.tenant?.name || "—"}</Link></td>
                      <td><Link href={href} className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{(b.billing_month as string)?.slice(0, 7) ?? b.billing_month}</Link></td>
                      <td><Link href={href} className="num">¥{Number(b.total_amount).toLocaleString()}</Link></td>
                      <td><Link href={href}><StatusBadge status={deriveBillingStatus(b)} /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash2-table">
          <div className="dash2-table-head">
            <h3 className="dash2-table-title">対応案件（未対応・対応中）</h3>
            <div className="dash2-table-meta">
              {s.open_cases > 0 && (
                <span className="badge badge-warn mono">{s.open_cases}件</span>
              )}
              <Link href="/cases" className="rlink is-muted" style={{ fontSize: 11 }}>すべて見る</Link>
            </div>
          </div>
          {activeCases.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "24px 0" }}>対応中の案件なし</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr><th>件名</th><th>物件</th><th>優先度</th><th>状態</th></tr>
              </thead>
              <tbody>
                {activeCases.slice(0, 10).map((c: Record<string, any>) => {
                  const href = `/cases/${c.id}`;
                  return (
                    <tr key={c.id} className="row-hover row-link">
                      <td><Link href={href} className="strong">{c.title}</Link></td>
                      <td><Link href={href} style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.property?.name || "—"}</Link></td>
                      <td><Link href={href}><StatusBadge status={c.priority} /></Link></td>
                      <td><Link href={href}><StatusBadge status={c.status} /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash2-table">
          <div className="dash2-table-head">
            <h3 className="dash2-table-title">契約満了間近（{s.contract_alert_days}日以内）</h3>
            <div className="dash2-table-meta">
              {(() => {
                const unhandled = expiringContracts.filter((c: Record<string, any>) => !c.renewal_effective_date).length;
                return unhandled > 0 ? <span className="badge badge-warn mono">未対応 {unhandled}件</span> : null;
              })()}
              <Link href="/contracts?filter=expiring" className="rlink is-muted" style={{ fontSize: 11 }}>すべて見る</Link>
            </div>
          </div>
          {expiringContracts.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "24px 0" }}>該当なし</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>入居者</th>
                  <th>物件・部屋</th>
                  <th>満了日</th>
                  <th>更新</th>
                  <th style={{ textAlign: "right" }}>案内</th>
                </tr>
              </thead>
              <tbody>
                {expiringContracts.map((c: Record<string, any>) => {
                  const href = `/contracts/${c.id}`;
                  const reserved = !!c.renewal_effective_date;
                  return (
                    <tr key={c.id} className="row-hover row-link">
                      <td><Link href={href} className="strong">{c.tenant?.name}</Link></td>
                      <td><Link href={href} style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.unit?.property?.name} {c.unit?.unit_number}</Link></td>
                      <td><Link href={href} className="mono" style={{ fontSize: 12 }}>{c.end_date}</Link></td>
                      <td>
                        {reserved ? (
                          <span className="badge badge-ok mono" title={`${c.renewal_effective_date} から適用`}>更新予約済</span>
                        ) : (
                          <span className="badge badge-warn mono">未対応</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <a href={`/api/contracts/${c.id}/renewal-notice`} target="_blank" rel="noopener noreferrer" className="rlink" style={{ fontSize: 12 }}>更新案内</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </>
  );
}
