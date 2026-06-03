"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MonthSelector from "./MonthSelector";
import FilterableTable from "./FilterableTable";
import StatusBadge from "./StatusBadge";

const categoryLabels: Record<string, string> = {
  repair: "設備修繕",
  key: "鍵対応",
  common_area: "共用部",
  tenant_trouble: "入居者間トラブル",
  neighbor: "近隣対応",
  inspection: "点検立会",
  inquiry: "質問・相談",
  request: "要望",
  complaint: "クレーム",
  other: "その他",
};

const KANBAN_COLS = [
  { key: "open", label: "未対応", tone: "warn" },
  { key: "in_progress", label: "対応中", tone: "info" },
  { key: "on_hold", label: "保留", tone: "neutral" },
  { key: "completed", label: "完了", tone: "accent" },
] as const;

interface CasesTableProps {
  data: Record<string, any>[];
  initialFilter?: string;
}

function getAvailableMonths(data: Record<string, any>[]): string[] {
  const set = new Set<string>();
  for (const item of data) {
    if (item.reported_date) set.add(item.reported_date.slice(0, 7));
  }
  return Array.from(set).sort().reverse();
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function CasesTable({ data, initialFilter }: CasesTableProps) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "kanban">("table");
  const dragItem = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // カンバンD&Dの楽観的更新は「保留中のステータス上書き」だけを state に持ち、
  // 表示の正は常に prop の data とする。これにより登録/更新後の router.refresh() で
  // data が更新されれば即座に反映される（state を data のコピーで持つと同期漏れでズレる）。
  const [pendingStatus, setPendingStatus] = useState<Record<string, string>>({});

  // data が pending と同じ状態に追いついた（router.refresh() でサーバーの値が
  // 反映された、あるいは別経路で更新された）エントリは pending から落とす。
  // これで pending は「まだ data に反映されていない楽観的上書き」だけを保持する。
  const settledIds = useMemo(
    () =>
      Object.keys(pendingStatus).filter((id) => {
        const row = data.find((m) => m.id === id);
        return !row || row.status === pendingStatus[id];
      }),
    [data, pendingStatus]
  );
  if (settledIds.length > 0) {
    setPendingStatus((prev) => {
      const next = { ...prev };
      for (const id of settledIds) delete next[id];
      return next;
    });
  }

  // data に pending の上書きを重ねた、表示用の確定データ
  const items = useMemo(
    () =>
      Object.keys(pendingStatus).length === 0
        ? data
        : data.map((m) =>
            pendingStatus[m.id] ? { ...m, status: pendingStatus[m.id] } : m
          ),
    [data, pendingStatus]
  );

  const availableMonths = useMemo(() => getAvailableMonths(items), [items]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const current = getCurrentMonth();
    return availableMonths.includes(current) ? current : availableMonths[0] || current;
  });

  const monthFiltered = useMemo(() => {
    if (selectedMonth === "all") return items;
    return items.filter((m) => m.reported_date?.startsWith(selectedMonth));
  }, [items, selectedMonth]);

  const sorted = useMemo(() => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    return [...monthFiltered].sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));
  }, [monthFiltered]);

  const byStatus = useMemo(() => {
    const map: Record<string, Record<string, any>[]> = {};
    for (const col of KANBAN_COLS) map[col.key] = [];
    for (const item of sorted) {
      const key = item.status || "open";
      if (map[key]) map[key].push(item);
      else map.open.push(item);
    }
    return map;
  }, [sorted]);

  const handleDragStart = useCallback((id: string) => {
    dragItem.current = id;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    setDragOverCol(colKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  const handleDrop = useCallback(async (colKey: string) => {
    setDragOverCol(null);
    const id = dragItem.current;
    if (!id) return;
    dragItem.current = null;

    const item = items.find((m) => m.id === id);
    if (!item || item.status === colKey) return;

    // 楽観的に列を移動して見せる（保留中の上書きとして保持）
    setPendingStatus((prev) => ({ ...prev, [id]: colKey }));

    const rollback = () =>
      setPendingStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: colKey }),
      });
      if (!res.ok) {
        rollback();
        return;
      }
      // サーバー反映成功 → data を取り直す。pending は残したままにし、
      // 新しい data が pending と一致した時点で settled 検出により自動で落ちる
      // （rollback すると refresh 完了までの一瞬、元の列にカードが戻って見える）。
      router.refresh();
    } catch {
      rollback();
    }
  }, [items, router]);

  return (
    <>
      <MonthSelector selectedMonth={selectedMonth} availableMonths={availableMonths} onChange={setSelectedMonth} />

      <div className="toolbar">
        <div className="tb-tabs">
          <span
            className={`tb-tab${view === "table" ? " is-active" : ""}`}
            onClick={() => setView("table")}
          >
            テーブル
          </span>
          <span
            className={`tb-tab${view === "kanban" ? " is-active" : ""}`}
            onClick={() => setView("kanban")}
          >
            カンバン
          </span>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="kanban">
          {KANBAN_COLS.map((col) => (
            <div
              key={col.key}
              className={`kb-col${dragOverCol === col.key ? " kb-col-dragover" : ""}`}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(col.key)}
            >
              <div className="kb-col-head">
                <span className={`tag ${col.tone}`}>{col.label}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>{byStatus[col.key].length}</span>
              </div>
              {byStatus[col.key].length === 0 ? (
                <div className="tn-board-empty">該当なし</div>
              ) : (
                byStatus[col.key].map((item) => (
                  <div
                    key={item.id}
                    className="kb-card"
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    style={{ cursor: "grab" }}
                  >
                    <div className="kb-card-prio">
                      <StatusBadge status={item.priority} />
                      {item.category && (
                        <span style={{ fontSize: 10, color: "var(--ink-4)" }}>
                          {categoryLabels[item.category] || item.category}
                        </span>
                      )}
                    </div>
                    <Link href={`/cases/${item.id}`} className="kb-card-title" style={{ textDecoration: "none", color: "inherit" }}>
                      {item.title}
                    </Link>
                    <div className="kb-card-prop">{item.property?.name || "物件未指定"} {item.unit?.unit_number || (item.property ? "共用部" : "")}</div>
                    <div className="kb-card-foot">
                      <span className="mono">{item.reported_date}</span>
                      <span>{item.vendor_name || "業者未定"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      ) : (
        <FilterableTable
          data={sorted}
          searchFields={["title", "property.name", "vendor_name"]}
          searchPlaceholder="件名・物件名で検索..."
          initialFilters={initialFilter === "open" ? { status: "open" } : {}}
          filters={[
            {
              key: "status",
              label: "状態",
              options: [
                { value: "open", label: "未対応" },
                { value: "in_progress", label: "対応中" },
                { value: "on_hold", label: "保留" },
                { value: "completed", label: "完了" },
                { value: "cancelled", label: "キャンセル" },
              ],
            },
            {
              key: "category",
              label: "種別",
              options: Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
            },
          ]}
          columns={[
            { key: "title", label: "件名", sortable: true, render: (item) => <span className="strong">{item.title}</span> },
            { key: "property.name", label: "物件", render: (item) => <span style={{ color: "var(--ink-2)" }}>{item.property?.name || "—"}</span> },
            { key: "unit.unit_number", label: "部屋", render: (item) => item.unit?.unit_number || (item.property ? "共用部" : "—") },
            { key: "category", label: "種別", render: (item) => <span style={{ color: "var(--ink-2)" }}>{categoryLabels[item.category] || item.category}</span> },
            { key: "priority", label: "優先度", render: (item) => <StatusBadge status={item.priority} /> },
            { key: "status", label: "状態", render: (item) => <StatusBadge status={item.status} /> },
            { key: "reported_date", label: "受付日", sortable: true },
            { key: "vendor_name", label: "業者", render: (item) => <span style={{ color: "var(--ink-2)" }}>{item.vendor_name || "—"}</span> },
            {
              key: "estimated_cost",
              label: "見積",
              align: "right" as const,
              render: (item) => (
                <span className="num">
                  {item.estimated_cost ? `¥${Number(item.estimated_cost).toLocaleString()}` : "—"}
                </span>
              ),
            },
          ]}
          onRowClick={(item) => router.push(`/cases/${item.id}`)}
          rowClassName={(item) => item.priority === "urgent" ? "bg-danger-tint" : ""}
        />
      )}
    </>
  );
}
