import {
  Banknote,
  Wrench,
  FileText,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { getDashboardData, getMonthlyTrend } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";

export default async function DashboardPage() {
  const [dashData, monthlyTrend] = await Promise.all([
    getDashboardData(),
    getMonthlyTrend(),
  ]);
  const {
    stats: s,
    overdueBillings,
    activeMaintenance,
    expiringContracts,
    openInquiries,
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
    s.alert_maintenance > 0 && {
      icon: Wrench,
      tone: "warn" as const,
      title: `修繕 要対応 ${s.alert_maintenance}件`,
      detail: "対応期限が迫っている案件があります",
      href: "/maintenance?filter=pending",
      action: "修繕一覧",
    },
    s.alert_inquiries > 0 && {
      icon: MessageSquare,
      tone: "danger" as const,
      title: `問い合わせ 未対応 ${s.alert_inquiries}件`,
      detail: "48時間以上未対応の問い合わせ",
      href: "/inquiries?filter=open",
      action: "対応する",
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
      {monthlyTrend.length > 0 && (
        <div className="dash2-section">
          <div className="dash2-section-head">
            <h2 className="dash2-section-title">
              家賃回収率<span className="dash2-section-title-sub">月次推移</span>
            </h2>
            <div className="dash2-chart-legend">
              <span className="legend-item"><span className="legend-dot" style={{ background: "var(--accent)" }} /> 回収率</span>
              <span className="legend-item"><span className="legend-line" style={{ background: "var(--accent)", borderTop: "1px dashed var(--accent)" }} /> 目標 95%</span>
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
              <div className="dash2-chart-target" style={{ bottom: "95%" }} />
              <div className="dash2-chart-bars">
                {monthlyTrend.map((m: Record<string, any>, i: number) => {
                  const isLast = i === monthlyTrend.length - 1;
                  return (
                    <div key={m.month} className="dash2-chart-bar-col">
                      <span className={`dash2-chart-val mono${isLast ? " is-last" : ""}`}>
                        {m.collectionRate}%
                      </span>
                      <div
                        className={`dash2-chart-bar${isLast ? " is-last" : ""}`}
                        style={{ height: `${m.collectionRate}%` }}
                      />
                      <span className={`dash2-chart-label mono${isLast ? " is-last" : ""}`}>
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
                {overdueBillings.map((b: Record<string, any>) => {
                  const href = `/rent/${b.id}`;
                  return (
                    <tr key={b.id} className="row-hover row-link">
                      <td><Link href={href} className="strong">{b.contract?.tenant?.name || "—"}</Link></td>
                      <td><Link href={href} className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{b.billing_month}</Link></td>
                      <td><Link href={href} className="num">¥{Number(b.total_amount).toLocaleString()}</Link></td>
                      <td><Link href={href}><StatusBadge status={b.status} /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash2-table">
          <div className="dash2-table-head">
            <h3 className="dash2-table-title">修繕対応中</h3>
            <div className="dash2-table-meta">
              {s.open_maintenance > 0 && (
                <span className="badge badge-warn mono">{s.open_maintenance}件</span>
              )}
              <Link href="/maintenance" className="rlink is-muted" style={{ fontSize: 11 }}>すべて見る</Link>
            </div>
          </div>
          {activeMaintenance.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "24px 0" }}>対応中の修繕なし</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr><th>件名</th><th>物件</th><th>優先度</th><th>状態</th></tr>
              </thead>
              <tbody>
                {activeMaintenance.map((m: Record<string, any>) => {
                  const href = `/maintenance/${m.id}`;
                  return (
                    <tr key={m.id} className="row-hover row-link">
                      <td><Link href={href} className="strong">{m.title}</Link></td>
                      <td><Link href={href} style={{ fontSize: 12, color: "var(--ink-3)" }}>{m.property?.name}</Link></td>
                      <td><Link href={href}><StatusBadge status={m.priority} /></Link></td>
                      <td><Link href={href}><StatusBadge status={m.status} /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash2-table">
          <div className="dash2-table-head">
            <h3 className="dash2-table-title">契約満了間近（3ヶ月以内）</h3>
            <div className="dash2-table-meta">
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
                  <th>種別</th>
                </tr>
              </thead>
              <tbody>
                {expiringContracts.map((c: Record<string, any>) => {
                  const href = `/contracts/${c.id}`;
                  return (
                    <tr key={c.id} className="row-hover row-link">
                      <td><Link href={href} className="strong">{c.tenant?.name}</Link></td>
                      <td><Link href={href} style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.unit?.property?.name} {c.unit?.unit_number}</Link></td>
                      <td><Link href={href} className="mono" style={{ fontSize: 12 }}>{c.end_date}</Link></td>
                      <td><Link href={href}><StatusBadge status={c.contract_type} /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash2-table">
          <div className="dash2-table-head">
            <h3 className="dash2-table-title">未対応の問い合わせ</h3>
            <div className="dash2-table-meta">
              <Link href="/inquiries" className="rlink is-muted" style={{ fontSize: 11 }}>すべて見る</Link>
            </div>
          </div>
          {openInquiries.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "24px 0" }}>未対応の問い合わせなし</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>件名</th>
                  <th>種別</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {openInquiries.map((inq: Record<string, any>) => {
                  const href = `/inquiries/${inq.id}`;
                  return (
                    <tr key={inq.id} className="row-hover row-link">
                      <td><Link href={href} className="strong">{inq.title}</Link></td>
                      <td><Link href={href}><StatusBadge status={inq.inquiry_type} /></Link></td>
                      <td><Link href={href}><StatusBadge status={inq.status} /></Link></td>
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
