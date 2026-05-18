"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatPhone } from "@/lib/phone";

interface InquiriesTableProps {
  inquiries: Record<string, any>[];
  initialFilter?: string;
}

type FilterTab = "all" | "open" | "in_progress" | "resolved";

function statusInfo(s: string) {
  if (s === "open") return { label: "未対応", tone: "danger" };
  if (s === "in_progress") return { label: "対応中", tone: "warn" };
  if (s === "resolved" || s === "closed") return { label: "完了", tone: "ok" };
  return { label: s, tone: "neutral" };
}

function priorityClass(p: string) {
  if (p === "urgent" || p === "high") return "danger";
  if (p === "normal") return "warn";
  return "neutral";
}

function priorityLabel(p: string) {
  if (p === "urgent") return "緊急";
  if (p === "high") return "高";
  if (p === "normal") return "通常";
  return "低";
}

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  return dateStr.slice(0, 10);
}

const TYPE_LABELS: Record<string, string> = {
  move_out: "退去",
  complaint: "クレーム",
  other: "その他",
  general: "その他",
  noise: "騒音",
  facility: "設備",
};

export default function InquiriesTable({ inquiries, initialFilter }: InquiriesTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>(() => {
    if (initialFilter === "open") return "open";
    return "all";
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = inquiries;
    if (filter === "open") list = list.filter((q) => q.status === "open");
    else if (filter === "in_progress") list = list.filter((q) => q.status === "in_progress");
    else if (filter === "resolved") list = list.filter((q) => q.status === "resolved" || q.status === "closed");

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (q) =>
          q.title?.toLowerCase().includes(s) ||
          q.tenant?.name?.toLowerCase().includes(s) ||
          q.property?.name?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [inquiries, filter, search]);

  useEffect(() => {
    if (filtered.length && (!selectedId || !filtered.find((q) => q.id === selectedId))) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = inquiries.find((q) => q.id === selectedId) || filtered[0] || null;

  const totals = {
    all: inquiries.length,
    open: inquiries.filter((q) => q.status === "open").length,
    in_progress: inquiries.filter((q) => q.status === "in_progress").length,
    resolved: inquiries.filter((q) => q.status === "resolved" || q.status === "closed").length,
  };

  const tabs: { key: FilterTab; label: string; count: number; danger?: boolean }[] = [
    { key: "all", label: "全て", count: totals.all },
    { key: "open", label: "未対応", count: totals.open, danger: true },
    { key: "in_progress", label: "対応中", count: totals.in_progress },
    { key: "resolved", label: "完了", count: totals.resolved },
  ];

  return (
    <>
      <div className="toolbar">
        <div className="tb-tabs">
          {tabs.map((t) => (
            <span
              key={t.key}
              className={`tb-tab${filter === t.key ? " is-active" : ""}${t.danger ? " danger" : ""}`}
              onClick={() => setFilter(t.key)}
            >
              {t.label}<span className="c">{t.count}</span>
            </span>
          ))}
        </div>
        <div className="tb-actions">
          <input
            type="text"
            className="input"
            placeholder="件名・入居者名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200, height: 32, fontSize: 12 }}
          />
        </div>
      </div>

      <div className="inq-pane">
        {/* 左: リスト */}
        <div className="inq-list">
          {filtered.map((q) => {
            const isSel = q.id === selectedId;
            const st = statusInfo(q.status);
            return (
              <div
                key={q.id}
                className={`inq-row${isSel ? " is-selected" : ""}${q.status === "open" ? " is-unread" : ""}`}
                onClick={() => setSelectedId(q.id)}
              >
                <div className="inq-row-head">
                  <span
                    className="tn-av"
                    style={{
                      width: 28, height: 28, fontSize: 11, flexShrink: 0,
                      background: "var(--accent-tint)", color: "var(--accent-deep)",
                    }}
                  >
                    {(q.tenant?.name || "?").charAt(0)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="inq-row-name">
                      <span className="strong">{q.tenant?.name || "—"}</span>
                      <span className="inq-from-tag inq-from-tenant">入居者</span>
                    </div>
                    <div className="inq-row-prop mono">
                      {q.property?.name || ""}{q.unit?.unit_number ? ` · #${q.unit.unit_number}` : ""}
                    </div>
                  </div>
                  <div className="inq-row-time mono">{timeAgo(q.created_at)}</div>
                </div>
                <div className="inq-row-subj">{q.title}</div>
                <div className="inq-row-preview">{q.description || ""}</div>
                <div className="inq-row-foot">
                  <span className={`badge ${st.tone}`}><span className="dot" />{st.label}</span>
                  <span className={`badge ${priorityClass(q.priority)}`} style={{ padding: "2px 7px" }}>{priorityLabel(q.priority)}</span>
                  <span className="inq-row-cat mono">{TYPE_LABELS[q.inquiry_type] || q.inquiry_type}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="inq-empty">該当する問い合わせはありません</div>}
        </div>

        {/* 右: 詳細プレビュー */}
        {selected ? (
          <InquiryPreview
            inquiry={selected}
            onOpenDetail={() => router.push(`/inquiries/${selected.id}`)}
          />
        ) : (
          <div className="inq-detail" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-4)" }}>
            問い合わせを選択してください
          </div>
        )}
      </div>
    </>
  );
}

function InquiryPreview({ inquiry, onOpenDetail }: { inquiry: Record<string, any>; onOpenDetail: () => void }) {
  const router = useRouter();
  const st = statusInfo(inquiry.status);
  const logs = (inquiry.inquiry_logs || []).sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="inq-detail">
      <div className="inq-detail-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="inq-detail-subject">{inquiry.title}</h2>
          <div className="inq-detail-meta">
            <span
              className="tn-av"
              style={{
                width: 24, height: 24, fontSize: 10,
                background: "var(--accent-tint)", color: "var(--accent-deep)",
              }}
            >
              {(inquiry.tenant?.name || "?").charAt(0)}
            </span>
            {inquiry.tenant?.id ? (
              <Link href={`/tenants/${inquiry.tenant.id}`} className="rlink">{inquiry.tenant.name}</Link>
            ) : (
              <span>{inquiry.tenant?.name || "—"}</span>
            )}
            <span style={{ color: "var(--ink-4)" }}>·</span>
            {inquiry.property?.id ? (
              <Link href={`/properties/${inquiry.property.id}`} className="rlink is-muted">{inquiry.property.name}</Link>
            ) : (
              <span className="text-ink-3">{inquiry.property?.name || ""}</span>
            )}
            {inquiry.unit?.unit_number && (
              <>
                <span style={{ color: "var(--ink-4)" }}>·</span>
                <span className="mono" style={{ color: "var(--ink-3)" }}>#{inquiry.unit.unit_number}</span>
              </>
            )}
          </div>
        </div>
        <div className="inq-detail-actions">
          <button className="btn btn-ghost btn-sm" onClick={onOpenDetail}>詳細を開く →</button>
        </div>
      </div>

      {/* 対応記録タイムライン */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 20px" }}>
        {inquiry.description && (
          <TimelineEntry
            label={inquiry.tenant?.name || "入居者"}
            tag="入居者"
            tagColor="info"
            content={inquiry.description}
            time={inquiry.created_at?.slice(0, 16).replace("T", " ")}
          />
        )}

        {logs.map((log: any) => {
          const isCustomer = log.action_type === "customer_reply";
          const isNote = log.action_type === "note";
          return (
            <TimelineEntry
              key={log.id}
              label={isCustomer ? (inquiry.tenant?.name || "入居者") : isNote ? "メモ" : "スタッフ"}
              tag={isCustomer ? "入居者" : isNote ? "メモ" : "対応"}
              tagColor={isCustomer ? "info" : isNote ? "neutral" : "accent"}
              content={log.content}
              time={log.created_at?.slice(0, 16).replace("T", " ")}
            />
          );
        })}

        {logs.length === 0 && !inquiry.description && (
          <div className="inq-empty">まだ対応記録がありません</div>
        )}
      </div>

      <LogInput inquiryId={inquiry.id} />

      {/* サイドバー情報 */}
      <div className="inq-sidebar">
        <div className="inq-side-section">
          <div className="inq-side-label mono">ステータス</div>
          <span className={`badge ${st.tone}`}><span className="dot" />{st.label}</span>
        </div>
        <div className="inq-side-section">
          <div className="inq-side-label mono">優先度</div>
          <span className={`badge ${priorityClass(inquiry.priority)}`}>{priorityLabel(inquiry.priority)}</span>
        </div>
        <div className="inq-side-section">
          <div className="inq-side-label mono">カテゴリ</div>
          <span className="inq-side-cat">{TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}</span>
        </div>
        <div className="inq-side-section">
          <div className="inq-side-label mono">差出人</div>
          {inquiry.tenant?.id ? (
            <Link href={`/tenants/${inquiry.tenant.id}`} className="rlink">{inquiry.tenant.name}</Link>
          ) : (
            <span>{inquiry.tenant?.name || "—"}</span>
          )}
          <div className="inq-side-sub mono">入居者</div>
        </div>
        {inquiry.tenant?.phone && (
          <div className="inq-side-section">
            <div className="inq-side-label mono">電話番号</div>
            <span className="mono" style={{ fontSize: 12 }}>{formatPhone(inquiry.tenant.phone)}</span>
          </div>
        )}
        {inquiry.property && (
          <div className="inq-side-section">
            <div className="inq-side-label mono">関連物件</div>
            <Link href={`/properties/${inquiry.property.id}`} className="rlink">{inquiry.property.name}</Link>
            {inquiry.unit?.unit_number && <div className="inq-side-sub mono">#{inquiry.unit.unit_number}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineEntry({ label, tag, tagColor, content, time }: {
  label: string; tag: string; tagColor: string; content: string; time: string;
}) {
  const colors: Record<string, { bg: string; fg: string }> = {
    info: { bg: "var(--info-tint)", fg: "var(--info)" },
    accent: { bg: "var(--accent-tint)", fg: "var(--accent-deep)" },
    neutral: { bg: "var(--bg-2)", fg: "var(--ink-3)" },
  };
  const c = colors[tagColor] || colors.neutral;
  return (
    <div style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{ width: 56, flexShrink: 0, fontSize: 10, color: "var(--ink-4)", fontFamily: "var(--font-mono)", lineHeight: "18px", paddingTop: 1 }}>
        {time?.slice(5)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
          <span style={{
            fontSize: 10, padding: "1px 6px", borderRadius: 4,
            background: c.bg, color: c.fg, fontWeight: 500,
          }}>{tag}</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{content}</p>
      </div>
    </div>
  );
}

const LOG_TABS = [
  { key: "customer_reply", label: "入居者から", placeholder: "入居者からの連絡内容…", tone: "info" },
  { key: "staff_reply", label: "スタッフ対応", placeholder: "対応内容を記録…", tone: "accent" },
  { key: "note", label: "メモ", placeholder: "社内メモ…", tone: "neutral" },
] as const;

function LogInput({ inquiryId }: { inquiryId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [type, setType] = useState<string>("customer_reply");
  const [sending, setSending] = useState(false);
  const tab = LOG_TABS.find((t) => t.key === type) || LOG_TABS[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), action_type: type }),
      });
      if (res.ok) {
        setText("");
        router.refresh();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ borderTop: "1px solid var(--line)" }}>
      <div style={{ display: "flex", gap: 0, padding: "6px 16px 0" }}>
        {LOG_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setType(t.key)}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: "6px 6px 0 0",
              border: "none",
              cursor: "pointer",
              fontWeight: type === t.key ? 600 : 400,
              background: type === t.key ? "var(--bg-2)" : "transparent",
              color: type === t.key ? "var(--ink)" : "var(--ink-3)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ padding: "4px 16px 10px", display: "flex", gap: 6, alignItems: "center" }}>
        <input
          className="input"
          style={{ flex: 1, height: 32, fontSize: 12 }}
          placeholder={tab.placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={!text.trim() || sending} className="btn btn-primary" style={{ height: 32, fontSize: 12, flexShrink: 0 }}>
          追加
        </button>
      </form>
    </div>
  );
}
