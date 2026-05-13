"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";
import RowMenu from "./RowMenu";
import InquiryFormModal from "./InquiryFormModal";

interface InquiriesTableProps {
  inquiries: Record<string, any>[];
}

function InlineEditTitle({ item, onSave }: { item: Record<string, any>; onSave: (id: string, field: string, value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function handleCommit() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== item.title) {
      onSave(item.id, "title", trimmed);
    } else {
      setValue(item.title);
    }
  }

  if (!editing) {
    return (
      <span
        className="font-medium cursor-pointer hover:bg-bg-2/50 rounded px-1 -mx-1 transition-colors"
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      >
        {item.title}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleCommit}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleCommit();
        if (e.key === "Escape") { setValue(item.title); setEditing(false); }
      }}
      onClick={(e) => e.stopPropagation()}
      className="text-[13px] font-medium rounded border border-line px-2 py-0.5 bg-surface w-full min-w-[120px]"
    />
  );
}

export default function InquiriesTable({ inquiries }: InquiriesTableProps) {
  const router = useRouter();
  const [editData, setEditData] = useState<Record<string, any> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function updateField(id: string, field: string, value: string) {
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    router.refresh();
  }

  async function handleDelete(item: Record<string, any>) {
    if (!confirm(`この問い合わせを削除しますか？`)) return;
    const res = await fetch(`/api/inquiries/${item.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("削除に失敗しました");
  }

  return (
    <>
      <FilterableTable
        data={inquiries}
        searchFields={["title"]}
        searchPlaceholder="件名で検索..."
        filters={[
          {
            key: "status",
            label: "状態",
            options: [
              { value: "open", label: "未対応" },
              { value: "in_progress", label: "対応中" },
              { value: "resolved", label: "対応済み" },
            ],
          },
          {
            key: "priority",
            label: "優先度",
            options: [
              { value: "urgent", label: "緊急" },
              { value: "high", label: "高" },
              { value: "normal", label: "通常" },
              { value: "low", label: "低" },
            ],
          },
        ]}
        columns={[
          {
            key: "status",
            label: "状態",
            render: (item) => (
              <select
                value={item.status}
                onChange={(e) => updateField(item.id, "status", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-[12px] rounded border border-line px-2 py-1 bg-surface"
              >
                <option value="open">未対応</option>
                <option value="in_progress">対応中</option>
                <option value="resolved">対応済み</option>
              </select>
            ),
          },
          {
            key: "title",
            label: "件名",
            render: (item) => <InlineEditTitle item={item} onSave={updateField} />,
          },
          {
            key: "inquiry_type",
            label: "種別",
            render: (item) => (
              <select
                value={item.inquiry_type}
                onChange={(e) => updateField(item.id, "inquiry_type", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-[12px] rounded border border-line px-2 py-1 bg-surface"
              >
                <option value="general">一般</option>
                <option value="complaint">クレーム</option>
                <option value="noise">騒音</option>
                <option value="facility">設備</option>
                <option value="move_out">退去</option>
                <option value="other">その他</option>
              </select>
            ),
          },
          {
            key: "priority",
            label: "優先度",
            render: (item) => (
              <select
                value={item.priority}
                onChange={(e) => updateField(item.id, "priority", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-[12px] rounded border border-line px-2 py-1 bg-surface"
              >
                <option value="low">低</option>
                <option value="normal">通常</option>
                <option value="high">高</option>
                <option value="urgent">緊急</option>
              </select>
            ),
          },
          { key: "created_at", label: "登録日", sortable: true, render: (item) => item.created_at?.slice(0, 10) },
        ]}
        actions={(item) => (
          <RowMenu
            onEdit={() => { setEditData(item); setModalOpen(true); }}
            onDelete={() => handleDelete(item)}
          />
        )}
        rowClassName={() => ""}
      />

      <InquiryFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        editData={editData}
      />
    </>
  );
}
