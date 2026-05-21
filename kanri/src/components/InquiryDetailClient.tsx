"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import InquiryFormModal from "./InquiryFormModal";

interface SelectOption {
  id: string;
  label: string;
}

interface InquiryDetailClientProps {
  inquiry: Record<string, any>;
  properties: SelectOption[];
  units: SelectOption[];
  tenants: SelectOption[];
}

const ACTION_TYPES = [
  { value: "staff_reply", label: "対応" },
  { value: "customer_reply", label: "入居者連絡" },
  { value: "note", label: "メモ" },
];

export default function InquiryDetailClient({ inquiry, properties, units, tenants }: InquiryDetailClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [actionType, setActionType] = useState("staff_reply");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleDelete() {
    if (!confirm("この問い合わせを削除しますか？")) return;
    const res = await fetch(`/api/inquiries/${inquiry.id}`, { method: "DELETE" });
    if (res.ok) router.push("/inquiries");
    else alert("削除に失敗しました");
  }

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

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLogOpen((v) => !v)}
          className="btn btn-primary flex items-center gap-1.5 text-[13px]"
        >
          <Plus size={13} />
          対応を追加
        </button>
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-secondary flex items-center gap-1.5 text-[13px]"
        >
          <Pencil size={13} />
          編集
        </button>
        <button
          onClick={handleDelete}
          className="p-2 rounded text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* インライン追加フォーム */}
      {logOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 240,
            right: 0,
            background: "var(--surface)",
            borderTop: "1px solid var(--line)",
            padding: "16px 24px",
            zIndex: 40,
            boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <form onSubmit={handleAddLog}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", maxWidth: 760 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <div style={{ display: "flex", gap: 6 }}>
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
                  style={{ fontSize: 13, minHeight: 64, resize: "vertical" }}
                  placeholder={
                    actionType === "staff_reply" ? "対応内容を記録…"
                    : actionType === "customer_reply" ? "入居者からの連絡内容を記録…"
                    : "社内メモ…"
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 30 }}>
                <button
                  type="submit"
                  disabled={!content.trim() || saving}
                  className="btn btn-primary"
                  style={{ fontSize: 12, opacity: (!content.trim() || saving) ? 0.5 : 1 }}
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
            </div>
          </form>
        </div>
      )}

      <InquiryFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editData={inquiry}
        properties={properties}
        units={units}
        tenants={tenants}
      />
    </>
  );
}
