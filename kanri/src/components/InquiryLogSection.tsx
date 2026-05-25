"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

const ACTION_TYPES = [
  { value: "staff_reply", label: "対応" },
  { value: "customer_reply", label: "入居者連絡" },
  { value: "note", label: "メモ" },
];

interface InquiryLogSectionProps {
  inquiry: Record<string, any>;
  logs: Record<string, any>[];
}

export default function InquiryLogSection({ inquiry, logs }: InquiryLogSectionProps) {
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);
  const [actionType, setActionType] = useState("staff_reply");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/inquiries/${inquiry.id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), action_type: actionType }),
      });
      if (res.ok) {
        setContent("");
        setLogOpen(false);
        router.refresh();
      } else {
        alert("追加に失敗しました");
      }
    } finally {
      setSaving(false);
    }
  }

  const colors: Record<string, { bg: string; fg: string }> = {
    info: { bg: "var(--info-tint)", fg: "var(--info)" },
    accent: { bg: "var(--accent-tint)", fg: "var(--accent-deep)" },
    neutral: { bg: "var(--bg-2)", fg: "var(--ink-3)" },
  };

  return (
    <div className="section">
      <div className="section-head-bar">
        <h2>対応記録</h2>
        <span className="desc">{logs.length}件</span>
        <button
          onClick={() => setLogOpen((v) => !v)}
          className="btn btn-primary flex items-center gap-1.5 text-[13px]"
          style={{ marginLeft: "auto" }}
        >
          <Plus size={13} />
          対応を追加
        </button>
      </div>
      <div className="section-body">
        {logOpen && (
          <form onSubmit={handleAddLog} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {ACTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setActionType(t.value)}
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 99,
                    border: "1px solid",
                    cursor: "pointer",
                    borderColor: actionType === t.value ? "var(--accent)" : "var(--line)",
                    background: actionType === t.value ? "var(--accent-tint)" : "transparent",
                    color: actionType === t.value ? "var(--accent-deep)" : "var(--ink-3)",
                    fontWeight: actionType === t.value ? 600 : 400,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              className="input"
              style={{ fontSize: 13, minHeight: 80, resize: "vertical", width: "100%" }}
              placeholder={
                actionType === "staff_reply" ? "対応内容を記録…"
                : actionType === "customer_reply" ? "入居者からの連絡内容を記録…"
                : "社内メモ…"
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                type="submit"
                disabled={!content.trim() || saving}
                className="btn btn-primary"
                style={{ fontSize: 12 }}
              >
                {saving ? "保存中…" : "追加"}
              </button>
              <button
                type="button"
                onClick={() => { setLogOpen(false); setContent(""); }}
                className="btn btn-ghost"
                style={{ fontSize: 12 }}
              >
                キャンセル
              </button>
            </div>
          </form>
        )}

        {inquiry.description && (
          <TimelineEntry
            label={inquiry.tenant?.name || "入居者"}
            tag="入居者"
            tagColor="info"
            content={inquiry.description}
            time={inquiry.created_at?.slice(0, 16).replace("T", " ")}
            colors={colors}
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
              colors={colors}
            />
          );
        })}
        {logs.length === 0 && !inquiry.description && (
          <p style={{ fontSize: 13, color: "var(--ink-4)", textAlign: "center", padding: "16px 0" }}>まだ対応記録がありません</p>
        )}
      </div>
    </div>
  );
}

function TimelineEntry({ label, tag, tagColor, content, time, colors }: {
  label: string;
  tag: string;
  tagColor: string;
  content: string;
  time: string;
  colors: Record<string, { bg: string; fg: string }>;
}) {
  const c = colors[tagColor] || colors.neutral;
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{ width: 64, flexShrink: 0, fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--font-mono)", lineHeight: "20px", paddingTop: 1 }}>
        {time?.slice(5)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
          <span style={{
            fontSize: 10, padding: "1px 6px", borderRadius: 4,
            background: c.bg, color: c.fg, fontWeight: 500,
          }}>{tag}</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{content}</p>
      </div>
    </div>
  );
}
