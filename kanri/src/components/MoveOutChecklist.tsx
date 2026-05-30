"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Plus, Check } from "lucide-react";
import { usePermission } from "@/lib/use-permission";

interface ChecklistItem {
  id: string;
  category: string;
  item_name: string;
  is_checked: boolean;
  notes: string | null;
  checked_at: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  notice: "退去通知",
  inspection: "立会い・点検",
  restoration: "原状回復",
  settlement: "精算",
  general: "その他",
};

export default function MoveOutChecklist({ contractId }: { contractId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const canEdit = usePermission("contracts:edit");

  const fetchItems = useCallback(async () => {
    const res = await fetch(`/api/contracts/${contractId}/checklist`);
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
    setLoading(false);
  }, [contractId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleCreate() {
    setCreating(true);
    const res = await fetch(`/api/contracts/${contractId}/checklist`, { method: "POST" });
    if (res.ok) await fetchItems();
    setCreating(false);
  }

  async function toggleItem(itemId: string, checked: boolean) {
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, is_checked: checked } : i));
    await fetch(`/api/contracts/${contractId}/checklist`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, is_checked: checked }),
    });
  }

  if (loading) return null;

  if (items.length === 0) {
    return (
      <div className="section">
        <div className="section-head-bar">
          <h2>退去チェックリスト</h2>
        </div>
        <div className="section-body" style={{ textAlign: "center", padding: "24px 0" }}>
          <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 12 }}>チェックリストがまだ作成されていません</p>
          {canEdit && (
            <button onClick={handleCreate} disabled={creating} className="btn btn-primary flex items-center gap-1.5 mx-auto text-[13px]">
              <Plus size={13} />
              {creating ? "作成中..." : "チェックリストを作成"}
            </button>
          )}
        </div>
      </div>
    );
  }

  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const cat = item.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const checkedCount = items.filter((i) => i.is_checked).length;
  const progress = Math.round((checkedCount / items.length) * 100);

  return (
    <div className="section">
      <div className="section-head-bar">
        <h2 style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ClipboardList size={16} />
          退去チェックリスト
        </h2>
        <span className="desc">{checkedCount}/{items.length}完了</span>
      </div>
      <div className="section-body">
        <div style={{ height: 4, background: "var(--bg-2)", borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: progress === 100 ? "var(--ok)" : "var(--accent)", transition: "width 0.3s", borderRadius: 2 }} />
        </div>

        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              {CATEGORY_LABELS[cat] || cat}
            </div>
            {catItems.map((item) => (
              <label
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: "1px solid var(--line)", cursor: "pointer",
                }}
              >
                <span
                  onClick={(e) => { e.preventDefault(); if (!canEdit) return; toggleItem(item.id, !item.is_checked); }}
                  style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    border: item.is_checked ? "none" : "2px solid var(--ink-4)",
                    background: item.is_checked ? "var(--accent)" : "transparent",
                    color: "#fff", transition: "all 0.15s",
                  }}
                >
                  {item.is_checked && <Check size={13} strokeWidth={3} />}
                </span>
                <span style={{
                  fontSize: 13,
                  color: item.is_checked ? "var(--ink-3)" : "var(--ink)",
                  textDecoration: item.is_checked ? "line-through" : "none",
                }}>
                  {item.item_name}
                </span>
                {item.checked_at && (
                  <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: "var(--ink-4)" }}>
                    {item.checked_at.slice(0, 10)}
                  </span>
                )}
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
