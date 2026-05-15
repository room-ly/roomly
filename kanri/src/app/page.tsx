import {
  AlertTriangle,
  Wrench,
  FileText,
  MessageSquare,
  LogOut,
  Hammer,
  Megaphone,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { getDashboardData, getMonthlyTrend } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";

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
    recentInquiries,
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

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="本日の"
        em="管理状況"
      />

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
        <div className="card p-5 relative overflow-hidden">
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-3">管理戸数</p>
          <div className="mt-3.5 flex items-baseline gap-1.5">
            <span className="text-[32px] leading-none tracking-tight font-semibold tabular-nums">{s.total_properties}</span>
            <span className="text-[13px] text-ink-3">棟 / {s.total_units}戸</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-ink-2">
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-accent-tint text-accent-deep">管理中</span>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-3">入居率</p>
          <div className="mt-3.5 flex items-baseline gap-1.5">
            <span className="text-[32px] leading-none tracking-tight font-semibold tabular-nums">{s.occupancy_rate}</span>
            <span className="text-[13px] text-ink-3">%</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-ink-2">
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-accent-tint text-accent-deep">
              {s.occupied_units}/{s.total_units}戸
            </span>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-3">空室</p>
          <div className="mt-3.5 flex items-baseline gap-1.5">
            <span className="text-[32px] leading-none tracking-tight font-semibold tabular-nums">{s.vacant_units}</span>
            <span className="text-[13px] text-ink-3">戸</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-ink-2">
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-info-tint text-info">募集可能</span>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-3">回収率</p>
          <div className="mt-3.5 flex items-baseline gap-1.5">
            <span className="text-[32px] leading-none tracking-tight font-semibold tabular-nums">{s.collection_rate}</span>
            <span className="text-[13px] text-ink-3">%</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-ink-2">
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-accent-tint text-accent-deep">
              ¥{s.total_rent_received.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* アラートストリップ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-7">
        <div className="card p-4 flex items-center gap-3.5">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-danger-tint text-danger grid place-items-center shrink-0">
            <Banknote size={18} />
          </div>
          <div>
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-3">滞納</p>
            <p className="text-[22px] font-semibold tracking-tight leading-none mt-1">{s.overdue_count}
              <span className="text-[13px] text-ink-3 ml-1">件</span>
            </p>
          </div>
          <p className="ml-auto font-mono text-[12px] text-ink-3">¥{s.overdue_amount.toLocaleString()}</p>
        </div>
        <div className="card p-4 flex items-center gap-3.5">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-warn-tint text-warn grid place-items-center shrink-0">
            <Wrench size={18} />
          </div>
          <div>
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-3">未対応修繕</p>
            <p className="text-[22px] font-semibold tracking-tight leading-none mt-1">{s.open_maintenance}
              <span className="text-[13px] text-ink-3 ml-1">件</span>
            </p>
          </div>
          <p className="ml-auto text-[12px] text-ink-3">対応待ち</p>
        </div>
        <div className="card p-4 flex items-center gap-3.5">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-info-tint text-info grid place-items-center shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-3">契約満了間近</p>
            <p className="text-[22px] font-semibold tracking-tight leading-none mt-1">{s.expiring_contracts}
              <span className="text-[13px] text-ink-3 ml-1">件</span>
            </p>
          </div>
          <p className="ml-auto text-[12px] text-ink-3">3ヶ月以内</p>
        </div>
      </div>

      {/* パイプライン */}
      <div className="card overflow-hidden mb-4">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line">
          <h2 className="text-[14px] font-semibold tracking-tight">退去・空室
            <span className="text-ink-3 text-[14px] font-normal ml-1.5" style={{ fontStyle: "italic" }}>パイプライン</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "1px", background: "var(--line)" }}>
          <div className="bg-surface p-4">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full bg-warn-tint text-warn">退去予定</span>
              <span className="ml-auto font-mono text-[11px] text-ink-4">{expiringWithDays.length}</span>
            </div>
            <div className="space-y-1.5">
              {expiringWithDays.length === 0 ? (
                <p className="text-[12px] text-ink-3 text-center py-3">該当なし</p>
              ) : (
                expiringWithDays.map((c: Record<string, any>) => (
                  <Link key={c.id} href={`/contracts/${c.id}`} className="bg-bg-2 rounded-lg p-2.5 flex flex-col gap-0.5 hover:bg-bg-3 transition-colors">
                    <span className="text-[13px] font-medium">{c.unit?.property?.name} {c.unit?.unit_number}</span>
                    <span className="text-[11px] text-ink-3">{c.tenant?.name}</span>
                    <span className={`font-mono text-[11px] mt-1 ${c.remainingDays <= 30 ? "text-danger" : "text-warn"}`}>
                      あと{c.remainingDays}日 · {c.end_date}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-surface p-4">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full bg-info-tint text-info">原状回復中</span>
              <span className="ml-auto font-mono text-[11px] text-ink-4">{maintenanceUnits.length}</span>
            </div>
            <div className="space-y-1.5">
              {maintenanceUnits.length === 0 ? (
                <p className="text-[12px] text-ink-3 text-center py-3">該当なし</p>
              ) : (
                maintenanceUnits.map((u: Record<string, any>) => (
                  <Link key={u.id} href={`/properties/${u.property_id}/units/${u.id}`} className="bg-bg-2 rounded-lg p-2.5 flex flex-col gap-0.5 hover:bg-bg-3 transition-colors">
                    <span className="text-[13px] font-medium">{u.property?.name} {u.unit_number}</span>
                    <span className="text-[11px] text-ink-3">¥{Number(u.rent).toLocaleString()}/月</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-surface p-4">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full bg-accent-tint text-accent-deep">募集中</span>
              <span className="ml-auto font-mono text-[11px] text-ink-4">{vacantUnits.length}</span>
            </div>
            <div className="space-y-1.5">
              {vacantUnits.length === 0 ? (
                <p className="text-[12px] text-ink-3 text-center py-3">該当なし</p>
              ) : (
                vacantUnits.map((u: Record<string, any>) => (
                  <Link key={u.id} href={`/properties/${u.property_id}/units/${u.id}`} className="bg-bg-2 rounded-lg p-2.5 flex flex-col gap-0.5 hover:bg-bg-3 transition-colors">
                    <span className="text-[13px] font-medium">{u.property?.name} {u.unit_number}</span>
                    <span className="text-[11px] text-ink-3">¥{Number(u.rent).toLocaleString()}/月</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 月次推移 */}
      {monthlyTrend.length > 0 && (
        <div className="card overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line">
            <h2 className="text-[14px] font-semibold tracking-tight">家賃回収率
              <span className="text-ink-3 text-[14px] font-normal ml-1.5" style={{ fontStyle: "italic" }}>月次推移</span>
            </h2>
            <span className="ml-auto badge badge-neutral font-mono">直近{monthlyTrend.length}ヶ月</span>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-3 h-[180px]">
              {monthlyTrend.map((m: Record<string, any>, i: number) => {
                const isLast = i === monthlyTrend.length - 1;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className={`font-mono text-[10px] tabular-nums ${isLast ? "text-ink font-semibold" : "text-ink-3"}`}>
                      {m.collectionRate}%
                    </span>
                    <div className="w-full bg-bg-2 rounded-t relative" style={{ height: "140px" }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t transition-all ${isLast ? "bg-ink" : "bg-accent"}`}
                        style={{ height: `${m.collectionRate}%` }}
                      />
                    </div>
                    <span className={`font-mono text-[10px] ${isLast ? "text-ink font-semibold" : "text-ink-3"}`}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* テーブル2列 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
            <h2 className="text-[14px] font-semibold">滞納一覧</h2>
            <div className="flex items-center gap-2">
              {s.overdue_count > 0 && (
                <span className="badge badge-danger font-mono">{s.overdue_count}件 / ¥{s.overdue_amount.toLocaleString()}</span>
              )}
              <Link href="/rent" className="text-[11px] text-accent hover:text-accent-deep transition-colors">すべて見る</Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            {overdueBillings.length === 0 ? (
              <p className="text-[13px] text-ink-3 py-6 text-center">滞納なし</p>
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
                        <td><Link href={href} className="font-mono text-[12px] text-ink-2">{b.billing_month}</Link></td>
                        <td><Link href={href} className="num">¥{Number(b.total_amount).toLocaleString()}</Link></td>
                        <td><Link href={href}><StatusBadge status={b.status} /></Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
            <h2 className="text-[14px] font-semibold">修繕対応中</h2>
            <div className="flex items-center gap-2">
              {s.open_maintenance > 0 && (
                <span className="badge badge-warn font-mono">{s.open_maintenance}件</span>
              )}
              <Link href="/maintenance" className="text-[11px] text-accent hover:text-accent-deep transition-colors">すべて見る</Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            {activeMaintenance.length === 0 ? (
              <p className="text-[13px] text-ink-3 py-6 text-center">対応中の修繕なし</p>
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
                        <td><Link href={href} className="text-[12px] text-ink-3">{m.property?.name}</Link></td>
                        <td><Link href={href}><StatusBadge status={m.priority} /></Link></td>
                        <td><Link href={href}><StatusBadge status={m.status} /></Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
            <h2 className="text-[14px] font-semibold">契約満了間近（3ヶ月以内）</h2>
            <Link href="/contracts" className="text-[11px] text-accent hover:text-accent-deep transition-colors">すべて見る</Link>
          </div>
          <div className="overflow-x-auto">
            {expiringContracts.length === 0 ? (
              <p className="text-[13px] text-ink-3 py-6 text-center">該当なし</p>
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
                        <td><Link href={href} className="text-[12px] text-ink-3">{c.unit?.property?.name} {c.unit?.unit_number}</Link></td>
                        <td><Link href={href} className="font-mono text-[12px]">{c.end_date}</Link></td>
                        <td><Link href={href}><StatusBadge status={c.contract_type} /></Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
            <h2 className="text-[14px] font-semibold">最近の問い合わせ</h2>
            <Link href="/inquiries" className="text-[11px] text-accent hover:text-accent-deep transition-colors">すべて見る</Link>
          </div>
          <div className="overflow-x-auto">
            {recentInquiries.length === 0 ? (
              <p className="text-[13px] text-ink-3 py-6 text-center">問い合わせなし</p>
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
                  {recentInquiries.map((inq: Record<string, any>) => {
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
      </div>
    </>
  );
}
