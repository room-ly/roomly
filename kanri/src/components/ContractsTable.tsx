"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ContractsTableProps {
  data: Record<string, any>[];
  alertDays?: number;
}

const CONTRACT_TYPE_LABEL: Record<string, string> = { fixed: "定期", ordinary: "普通" };

type FilterKey = "active" | "renewal" | "ending" | "all";

function getContractStatus(c: Record<string, any>, alertDays: number) {
  if (c._move_out_status === "approved" || c._move_out_status === "pending") return "ending";
  if (c.end_date) {
    const remaining = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (remaining <= 0) return "expired";
    if (remaining <= alertDays) return "renewal";
  }
  return "active";
}

function ContractMeter({ startDate, endDate, alertDays }: { startDate?: string; endDate?: string; alertDays: number }) {
  if (!startDate || !endDate) return <span style={{ color: "var(--ink-3)" }}>—</span>;
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const elapsed = Math.max(0, (now - start) / (end - start));
  const remainingDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  const remainingMonths = Math.max(0, Math.ceil(remainingDays / 30));
  const pct = Math.round(Math.min(100, Math.max(0, elapsed * 100)) * 10000) / 10000;
  const isExpired = remainingDays <= 0;
  const isUrgent = remainingDays > 0 && remainingDays <= 30;
  const color = isExpired ? "var(--danger)" : isUrgent ? "var(--danger)" : remainingDays <= alertDays ? "var(--warn)" : "var(--accent)";
  return (
    <div>
      <div className="tn-contract-cell">
        <div className="tn-meter-wrap">
          <div className="tn-meter">
            <div className="tn-meter-fill" style={{ width: `${pct}%`, background: color }} />
            <span className="tn-meter-tick" style={{ left: "25%" }} />
            <span className="tn-meter-tick" style={{ left: "50%" }} />
            <span className="tn-meter-tick" style={{ left: "75%" }} />
          </div>
        </div>
        <span className="mono" style={{ fontSize: 11, color: isExpired ? "var(--danger)" : "var(--ink-3)" }}>
          {isExpired ? "期限切れ" : `残${remainingMonths}ヶ月`}
        </span>
      </div>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", marginTop: 4 }}>
        {startDate} 〜 {endDate}
      </div>
    </div>
  );
}

export default function ContractsTable({ data, alertDays = 90 }: ContractsTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("active");

  const enrichedData = useMemo(() => {
    return data.map((c) => {
      (c as any)._status = getContractStatus(c, alertDays);
      return c;
    });
  }, [data, alertDays]);

  const totals = useMemo(() => ({
    all: enrichedData.length,
    active: enrichedData.filter((c) => c._status === "active" || c._status === "renewal" || c._status === "ending").length,
    renewal: enrichedData.filter((c) => c._status === "renewal").length,
    ending: enrichedData.filter((c) => c._status === "ending").length,
  }), [enrichedData]);

  const filtered = useMemo(() => {
    if (filter === "all") return enrichedData;
    if (filter === "active") return enrichedData.filter((c) => c._status === "active" || c._status === "renewal" || c._status === "ending");
    return enrichedData.filter((c) => c._status === filter);
  }, [enrichedData, filter]);

  return (
    <>
      <div className="toolbar">
        <div className="tb-tabs">
          <span className={`tb-tab${filter === "active" ? " is-active" : ""}`} onClick={() => setFilter("active")}>
            有効<span className="c">{totals.active}</span>
          </span>
          <span className={`tb-tab${filter === "renewal" ? " is-active" : ""}`} onClick={() => setFilter("renewal")}>
            更新間近<span className="c">{totals.renewal}</span>
          </span>
          <span className={`tb-tab${filter === "ending" ? " is-active" : ""}`} onClick={() => setFilter("ending")}>
            退去予告<span className="c">{totals.ending}</span>
          </span>
          <span className={`tb-tab${filter === "all" ? " is-active" : ""}`} onClick={() => setFilter("all")}>
            全て<span className="c">{totals.all}</span>
          </span>
        </div>
        <div className="tb-actions">
          <button className="btn btn-ghost btn-sm">CSV</button>
        </div>
      </div>

      <div className="section">
        <div className="section-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>入居者</th>
                <th>物件 / 部屋</th>
                <th>契約種別</th>
                <th>契約期間</th>
                <th style={{ textAlign: "right" }}>賃料</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const statusInfo: Record<string, { label: string; tone: string }> = {
                  active: { label: "有効", tone: "ok" },
                  renewal: { label: "更新間近", tone: "warn" },
                  ending: { label: "退去予告", tone: "warn" },
                  expired: { label: "終了", tone: "neutral" },
                };
                const st = statusInfo[c._status] || statusInfo.active;
                return (
                  <tr key={c.id} className="row-hover" style={{ cursor: "pointer" }} onClick={(e) => { if ((e.target as HTMLElement).closest("a")) return; router.push(`/contracts/${c.id}`); }}>
                    <td>
                      <Link href={`/contracts/${c.id}`} className="strong" style={{ color: "inherit", textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>{c.tenant?.name}</Link>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {c.unit?.property?.id ? (
                        <Link href={`/properties/${c.unit.property.id}`} className="rlink" style={{ color: "var(--ink-2)" }}>
                          {c.unit.property.name}
                        </Link>
                      ) : (
                        <span style={{ color: "var(--ink-2)" }}>{c.unit?.property?.name}</span>
                      )}
                      {c.unit?.id && c.unit?.property_id ? (
                        <Link href={`/properties/${c.unit.property_id}/units/${c.unit.id}`} className="rlink mono" style={{ marginLeft: 6, color: "var(--ink-3)" }}>
                          #{c.unit.unit_number}
                        </Link>
                      ) : (
                        <span className="mono" style={{ marginLeft: 6, color: "var(--ink-3)" }}>#{c.unit?.unit_number}</span>
                      )}
                    </td>
                    <td><span className="badge neutral">{CONTRACT_TYPE_LABEL[c.contract_type] || c.contract_type}</span></td>
                    <td>
                      <ContractMeter startDate={c.start_date} endDate={c.end_date} alertDays={alertDays} />
                    </td>
                    <td className="num">¥{Number(c.rent).toLocaleString()}</td>
                    <td><span className={`badge ${st.tone}`}><span className="dot" />{st.label}</span></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px 16px", color: "var(--ink-3)" }}>
                    該当する契約がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
