"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/phone";

interface TenantsTableProps {
  data: Record<string, any>[];
}

const AVATAR_TONES = [
  { bg: "#e8f0e8", fg: "#3f5a4c" },
  { bg: "#e1e8f1", fg: "#3a5580" },
  { bg: "#f8eed8", fg: "#8a6420" },
  { bg: "#fbe6dc", fg: "#8a4020" },
  { bg: "#e8e0f0", fg: "#5a4080" },
  { bg: "#d8e8e8", fg: "#2a5050" },
];

function avatarTone(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const t = avatarTone(name);
  return (
    <span className="tn-av" style={{ width: size, height: size, fontSize: size * 0.42, background: t.bg, color: t.fg }}>
      {(name || "?").charAt(0)}
    </span>
  );
}

function ContractMeter({ startDate, endDate, alertDays = 90 }: { startDate?: string; endDate?: string; alertDays?: number }) {
  if (!startDate || !endDate) return null;
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const elapsed = Math.max(0, (now - start) / (end - start));
  const remainingDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  const remainingMonths = Math.max(0, Math.ceil(remainingDays / 30));
  const pct = Math.round(Math.min(100, Math.max(0, elapsed * 100)) * 10000) / 10000;
  const color = remainingDays <= 0 ? "var(--danger)" : remainingDays <= 90 ? "var(--warn)" : "var(--accent)";
  return (
    <div className="tn-contract-cell">
      <div className="tn-meter-wrap">
        <div className="tn-meter">
          <div className="tn-meter-fill" style={{ width: `${pct}%`, background: color }} />
          <span className="tn-meter-tick" style={{ left: "25%" }} />
          <span className="tn-meter-tick" style={{ left: "50%" }} />
          <span className="tn-meter-tick" style={{ left: "75%" }} />
        </div>
      </div>
      <span className="mono" style={{ fontSize: 11, color: remainingDays <= 0 ? "var(--danger)" : "var(--ink-3)" }}>
        {remainingDays <= 0 ? "期限切れ" : `残${remainingMonths}ヶ月`}
      </span>
    </div>
  );
}

function StatusPill({ tenant }: { tenant: Record<string, any> }) {
  const contract = tenant.contract;
  if (!contract) return <span className="badge neutral"><span className="dot" />未契約</span>;

  if (contract._move_out_status === "approved" || contract._move_out_status === "pending") {
    return <span className="badge warn"><span className="dot" />退去予告</span>;
  }

  const overdue = tenant._has_overdue;
  if (overdue) return <span className="badge danger"><span className="dot" />滞納</span>;

  const endDate = contract.end_date;
  if (endDate) {
    const remaining = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (remaining <= 0) return <span className="badge danger"><span className="dot" />期限切れ</span>;
    if (remaining <= 90) return <span className="badge warn"><span className="dot" />更新間近</span>;
  }

  return <span className="badge ok"><span className="dot" />入居中</span>;
}

type ViewKey = "table" | "byprop" | "board";

const VIEWS: { key: ViewKey; label: string; hint: string }[] = [
  { key: "table", label: "テーブル", hint: "高密度。日次の点検・横断検索に最適" },
  { key: "byprop", label: "物件別", hint: "建物ごとの稼働と入居者構成が一目でわかる" },
  { key: "board", label: "状態ボード", hint: "要対応の入居者を炙り出す" },
];

type FilterKey = "all" | "overdue" | "leaving" | "renew";

function getStatus(t: Record<string, any>): FilterKey {
  const contract = t.contract;
  if (!contract) return "all";
  if (t._has_overdue) return "overdue";
  if (contract._move_out_status === "approved" || contract._move_out_status === "pending") return "leaving";
  if (contract.end_date) {
    const remaining = Math.ceil((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (remaining > 0 && remaining <= 90) return "renew";
  }
  return "all";
}

function ViewTable({ rows, onRowClick }: { rows: Record<string, any>[]; onRowClick: (item: Record<string, any>) => void }) {
  return (
    <div className="section">
      <div className="section-body flush">
        <table className="tbl">
          <thead>
            <tr>
              <th>入居者</th>
              <th>物件 / 部屋</th>
              <th>契約期間</th>
              <th style={{ textAlign: "right" }}>賃料</th>
              <th>状態</th>
              <th style={{ width: 64 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="row-hover" style={{ cursor: "pointer" }} onClick={() => onRowClick(t)}>
                <td>
                  <div className="tn-name-cell">
                    <Avatar name={t.name || ""} size={28} />
                    <div>
                      <span className="strong">{t.name}</span>
                      {t.name_kana && <div className="tn-kana">{t.name_kana}</div>}
                    </div>
                  </div>
                </td>
                <td>
                  {t.contract?.unit ? (
                    <>
                      <span style={{ color: "var(--ink-2)" }}>{t.contract.unit.property?.name}</span>
                      <span className="mono" style={{ marginLeft: 6, color: "var(--ink-3)", fontSize: 11 }}>#{t.contract.unit.unit_number}</span>
                    </>
                  ) : (
                    <span style={{ color: "var(--ink-3)" }}>—</span>
                  )}
                </td>
                <td>
                  <ContractMeter startDate={t.contract?.start_date} endDate={t.contract?.end_date} />
                </td>
                <td className="num">
                  {t.contract ? `¥${Number(t.contract.rent).toLocaleString()}` : "—"}
                </td>
                <td><StatusPill tenant={t} /></td>
                <td><button className="btn btn-ghost btn-sm" style={{ padding: "4px 10px" }}>詳細</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ViewByProperty({ rows, onRowClick }: { rows: Record<string, any>[]; onRowClick: (item: Record<string, any>) => void }) {
  const groups = useMemo(() => {
    const map: Record<string, Record<string, any>[]> = {};
    rows.forEach((t) => {
      const propName = t.contract?.unit?.property?.name || "未割当";
      (map[propName] = map[propName] || []).push(t);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [rows]);

  return (
    <div className="tn-grouplist">
      {groups.map(([propName, list]) => {
        const sum = list.reduce((s, t) => s + (Number(t.contract?.rent) || 0), 0);
        const issues = list.filter((t) => t._has_overdue || t.contract?._move_out_status).length;
        return (
          <div key={propName} className="tn-group">
            <div className="tn-group-head">
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em" }}>{propName}</span>
                <div className="tn-group-sub mono">{list.length}名入居 · ¥{sum.toLocaleString()}/月</div>
              </div>
              {issues > 0 ? <span className="badge warn"><span className="dot" />要確認 {issues}</span> : <span className="badge ok"><span className="dot" />順調</span>}
            </div>
            <div className="tn-group-body">
              {list.map((t) => (
                <div key={t.id} className="tn-row" onClick={() => onRowClick(t)} style={{ cursor: "pointer" }}>
                  <span className="mono tn-room">#{t.contract?.unit?.unit_number || "—"}</span>
                  <Avatar name={t.name || ""} size={28} />
                  <div className="tn-row-name">
                    <div className="strong">{t.name}</div>
                    {t.name_kana && <div className="tn-kana">{t.name_kana}</div>}
                  </div>
                  <div className="tn-row-meter">
                    <ContractMeter startDate={t.contract?.start_date} endDate={t.contract?.end_date} />
                  </div>
                  <div className="num tn-row-rent">{t.contract ? `¥${Number(t.contract.rent).toLocaleString()}` : "—"}</div>
                  <div className="tn-row-state"><StatusPill tenant={t} /></div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ViewBoard({ rows, onRowClick }: { rows: Record<string, any>[]; onRowClick: (item: Record<string, any>) => void }) {
  const cols = [
    { key: "stable", label: "入居中・安定", tone: "ok", desc: "契約90日以上残" },
    { key: "renew", label: "更新間近", tone: "warn", desc: "残90日以下" },
    { key: "leaving", label: "退去予告", tone: "warn", desc: "退去手続中" },
    { key: "overdue", label: "滞納・要対応", tone: "danger", desc: "支払い遅延" },
  ];

  const bucket = (t: Record<string, any>) => {
    const st = getStatus(t);
    if (st === "overdue") return "overdue";
    if (st === "leaving") return "leaving";
    if (st === "renew") return "renew";
    return "stable";
  };

  const groups: Record<string, Record<string, any>[]> = { stable: [], renew: [], leaving: [], overdue: [] };
  rows.forEach((t) => groups[bucket(t)].push(t));

  return (
    <div className="kanban">
      {cols.map((c) => (
        <div className="kb-col" key={c.key}>
          <div className="kb-col-head">
            <span className={`badge ${c.tone}`}>{c.label}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>{groups[c.key].length}</span>
          </div>
          <div className="tn-board-desc mono">{c.desc}</div>
          {groups[c.key].map((t) => (
            <div className="tn-board-card" key={t.id} onClick={() => onRowClick(t)} style={{ cursor: "pointer" }}>
              <div className="tn-board-card-head">
                <Avatar name={t.name || ""} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="strong" style={{ fontSize: 13 }}>{t.name}</div>
                  {t.name_kana && <div className="tn-kana">{t.name_kana}</div>}
                </div>
              </div>
              <div className="tn-board-card-meta">
                <span className="mono">{t.contract?.unit?.property?.name || "—"}</span>
                <span className="mono" style={{ color: "var(--ink-4)" }}>#{t.contract?.unit?.unit_number || "—"}</span>
              </div>
              <div className="tn-board-card-foot">
                <span className="num mono">{t.contract ? `¥${Number(t.contract.rent).toLocaleString()}` : "—"}<small>/月</small></span>
                {t.contract?.end_date && (
                  <span className="mono" style={{ color: "var(--ink-4)" }}>
                    残{Math.max(0, Math.ceil((new Date(t.contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))}ヶ月
                  </span>
                )}
              </div>
            </div>
          ))}
          {groups[c.key].length === 0 && <div className="tn-board-empty">該当なし</div>}
        </div>
      ))}
    </div>
  );
}

export default function TenantsTable({ data }: TenantsTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [view, setView] = useState<ViewKey>("table");

  const totals = useMemo(() => ({
    all: data.length,
    overdue: data.filter((t) => getStatus(t) === "overdue").length,
    leaving: data.filter((t) => getStatus(t) === "leaving").length,
    renew: data.filter((t) => getStatus(t) === "renew").length,
  }), [data]);

  const filtered = useMemo(() => {
    if (filter === "all") return data;
    return data.filter((t) => getStatus(t) === filter);
  }, [data, filter]);

  const onRowClick = (item: Record<string, any>) => router.push(`/tenants/${item.id}`);

  const ViewComponent = view === "table" ? ViewTable : view === "byprop" ? ViewByProperty : ViewBoard;

  return (
    <>
      <div className="toolbar">
        <div className="tb-tabs">
          <span className={`tb-tab${filter === "all" ? " is-active" : ""}`} onClick={() => setFilter("all")}>
            全員<span className="c">{totals.all}</span>
          </span>
          <span className={`tb-tab danger${filter === "overdue" ? " is-active" : ""}`} onClick={() => setFilter("overdue")}>
            滞納<span className="c">{totals.overdue}</span>
          </span>
          <span className={`tb-tab${filter === "leaving" ? " is-active" : ""}`} onClick={() => setFilter("leaving")}>
            退去予告<span className="c">{totals.leaving}</span>
          </span>
          <span className={`tb-tab${filter === "renew" ? " is-active" : ""}`} onClick={() => setFilter("renew")}>
            更新間近<span className="c">{totals.renew}</span>
          </span>
        </div>
        <div className="tb-actions">
          <button className="btn btn-ghost btn-sm">フィルタ</button>
          <button className="btn btn-ghost btn-sm">並び替え</button>
        </div>
      </div>

      <div className="tn-viewbar">
        <div className="tn-viewbar-tabs">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              className={`tn-viewbar-tab${view === v.key ? " is-active" : ""}`}
              onClick={() => setView(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="tn-viewbar-hint">{VIEWS.find((v) => v.key === view)?.hint}</div>
      </div>

      <ViewComponent rows={filtered} onRowClick={onRowClick} />
    </>
  );
}
