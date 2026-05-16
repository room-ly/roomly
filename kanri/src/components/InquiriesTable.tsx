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
          <InquiryPreview inquiry={selected} onOpenDetail={() => router.push(`/inquiries/${selected.id}`)} />
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

      {/* スレッド */}
      <div className="inq-thread">
        {inquiry.description && (
          <div className="inq-msg inq-msg-in with-avatar">
            <div className="inq-msg-avatar-slot">
              <span
                className="tn-av"
                style={{
                  width: 32, height: 32, fontSize: 12,
                  background: "var(--info-tint)", color: "var(--info)",
                }}
              >
                {(inquiry.tenant?.name || "?").charAt(0)}
              </span>
            </div>
            <div className="inq-msg-content">
              <div className="inq-msg-head">
                <span className="strong">{inquiry.tenant?.name || "入居者"}</span>
                <span className="inq-from-tag inq-from-tenant">入居者</span>
              </div>
              <div className="inq-msg-bubble">
                <p className="inq-msg-body">{inquiry.description}</p>
              </div>
              <span className="inq-msg-time mono">{inquiry.created_at?.slice(0, 16).replace("T", " ")}</span>
            </div>
          </div>
        )}

        {logs.map((log: any) => {
          const isStaff = log.action_type !== "customer_reply";
          return (
            <div key={log.id} className={`inq-msg ${isStaff ? "inq-msg-out" : "inq-msg-in"} with-avatar`}>
              <div className="inq-msg-avatar-slot">
                <span
                  className="tn-av"
                  style={{
                    width: 32, height: 32, fontSize: 12,
                    background: isStaff ? "var(--accent-tint)" : "var(--info-tint)",
                    color: isStaff ? "var(--accent-deep)" : "var(--info)",
                  }}
                >
                  {isStaff ? "S" : (inquiry.tenant?.name || "?").charAt(0)}
                </span>
              </div>
              <div className="inq-msg-content">
                <div className="inq-msg-head">
                  <span className="strong">{isStaff ? "スタッフ" : inquiry.tenant?.name || "入居者"}</span>
                </div>
                <div className="inq-msg-bubble">
                  <p className="inq-msg-body">{log.content}</p>
                </div>
                <span className="inq-msg-time mono">{log.created_at?.slice(0, 16).replace("T", " ")}</span>
              </div>
            </div>
          );
        })}

        {logs.length === 0 && !inquiry.description && (
          <div className="inq-empty">まだ対応履歴がありません</div>
        )}
      </div>

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
