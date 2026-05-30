"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, User as UserIcon, ChevronRight } from "lucide-react";
import { fieldLabel, fieldType, formatFieldValue, isIgnoredField } from "@/lib/audit-field-labels";
import { subscribeAuditLogRefresh } from "@/lib/audit-events";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: "create" | "update" | "delete";
  user_id: string | null;
  created_at: string;
  before_values: Record<string, unknown> | null;
  after_values: Record<string, unknown> | null;
  user: { name: string; email: string } | null;
}

interface AuditLogSectionProps {
  table: string;
  recordId: string;
  recordLabel?: string;
}

const ACTION_LABEL: Record<AuditLog["action"], string> = {
  create: "作成",
  update: "更新",
  delete: "削除",
};

const ACTION_COLOR: Record<AuditLog["action"], string> = {
  create: "text-accent-deep bg-accent-tint",
  update: "text-ink-2 bg-bg-2",
  delete: "text-danger bg-danger-tint",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

interface FieldDiff {
  key: string;
  before: unknown;
  after: unknown;
}

// 「空とみなせる」値: null / undefined / 空文字
function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

// 同値判定: 数値文字列と数値、空系の値同士などを同値扱いにする
function isSameValue(a: unknown, b: unknown): boolean {
  if (isEmpty(a) && isEmpty(b)) return true;
  if (isEmpty(a) || isEmpty(b)) return false;
  // 数値と数値文字列を同一視（"100" と 100、"100.00" と 100 等）
  const na = typeof a === "number" ? a : Number(a);
  const nb = typeof b === "number" ? b : Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && String(a).trim() !== "" && String(b).trim() !== "") {
    if (na === nb) return true;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

function computeDiffs(log: AuditLog): FieldDiff[] {
  const before = log.before_values ?? {};
  const after = log.after_values ?? {};
  const allKeys = new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ]);
  const diffs: FieldDiff[] = [];
  for (const key of allKeys) {
    if (isIgnoredField(key)) continue;
    const b = (before as Record<string, unknown>)[key];
    const a = (after as Record<string, unknown>)[key];
    if (log.action === "create") {
      if (!isEmpty(a)) diffs.push({ key, before: null, after: a });
    } else if (log.action === "delete") {
      if (!isEmpty(b)) diffs.push({ key, before: b, after: null });
    } else {
      if (!isSameValue(b, a)) diffs.push({ key, before: b, after: a });
    }
  }
  return diffs;
}

export default function AuditLogSection({ table, recordId, recordLabel }: AuditLogSectionProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/audit-logs?table=${encodeURIComponent(table)}&record_id=${encodeURIComponent(recordId)}&limit=30`,
        { cache: "no-store" },
      );
      const data = res.ok ? await res.json() : [];
      setLogs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [table, recordId]);

  useEffect(() => {
    fetchLogs();
    // 編集モーダル等で保存・削除されたタイミングで再fetch
    const unsubscribe = subscribeAuditLogRefresh(() => {
      fetchLogs();
    });
    return () => unsubscribe();
  }, [fetchLogs]);

  const label = recordLabel ?? "レコード";

  return (
    <section className="section">
      <div className="section-head-bar">
        <h2 className="flex items-center gap-1.5">
          <Clock size={15} />
          更新履歴
        </h2>
        <span className="desc">{logs.length}件</span>
      </div>
      <div className="section-body">
        {loading ? (
          <p className="text-[13px] text-ink-3">読み込み中...</p>
        ) : logs.length === 0 ? (
          <p className="text-[13px] text-ink-3">履歴がありません</p>
        ) : (
          <ul className="space-y-1">
            {logs.map((log) => {
              const isOpen = openId === log.id;
              const diffs = computeDiffs(log);
              const canExpand = diffs.length > 0;
              return (
                <li key={log.id} className="border-b border-line last:border-0">
                  <button
                    onClick={() => canExpand && setOpenId(isOpen ? null : log.id)}
                    disabled={!canExpand}
                    className="w-full flex items-center gap-2 text-[13px] py-1.5 px-2 -mx-2 text-left hover:bg-bg-2 rounded transition-colors disabled:hover:bg-transparent disabled:cursor-default whitespace-nowrap"
                  >
                    <ChevronRight
                      size={12}
                      className={`text-ink-3 transition-transform flex-shrink-0 ${isOpen ? "rotate-90" : ""} ${canExpand ? "" : "opacity-0"}`}
                    />
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${ACTION_COLOR[log.action]}`}>
                      {ACTION_LABEL[log.action]}
                    </span>
                    <UserIcon size={12} className="text-ink-3 flex-shrink-0" />
                    <span className="text-ink-2 truncate min-w-0 flex-1">
                      {log.user?.name ?? <span className="text-ink-3">システム</span>}
                    </span>
                    {canExpand && (
                      <span className="text-[11px] text-ink-3 flex-shrink-0">
                        {log.action === "update" ? `${diffs.length}項目` : ""}
                      </span>
                    )}
                    <span className="text-ink-3 text-[12px] flex-shrink-0">
                      {formatTime(log.created_at)}
                    </span>
                  </button>

                  {isOpen && canExpand && (
                    <div className="ml-5 mb-2 mt-1 px-3 py-2 rounded bg-bg-2 border border-line">
                      <table className="text-[12px] w-full">
                        <tbody>
                          {diffs.map((d) => {
                            const t = fieldType(table, d.key);
                            return (
                              <tr key={d.key} className="align-top">
                                <td className="text-ink-3 pr-3 py-0.5 whitespace-nowrap">
                                  {fieldLabel(table, d.key)}
                                </td>
                                <td className="py-0.5">
                                  {log.action === "update" ? (
                                    <span>
                                      <span className="text-ink-3 line-through">{formatFieldValue(d.before, t)}</span>
                                      <span className="mx-2 text-ink-3">→</span>
                                      <span className="text-ink">{formatFieldValue(d.after, t)}</span>
                                    </span>
                                  ) : log.action === "create" ? (
                                    <span className="text-ink">{formatFieldValue(d.after, t)}</span>
                                  ) : (
                                    <span className="text-ink-3 line-through">{formatFieldValue(d.before, t)}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {logs.length === 30 && (
          <p className="text-[11px] text-ink-3 mt-2">最新30件を表示しています</p>
        )}
        <p className="text-[11px] text-ink-3 mt-2">{label}の変更履歴</p>
      </div>
    </section>
  );
}
