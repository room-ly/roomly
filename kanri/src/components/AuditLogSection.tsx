"use client";

import { useEffect, useState } from "react";
import { Clock, User as UserIcon } from "lucide-react";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: "create" | "update" | "delete";
  user_id: string | null;
  created_at: string;
  user: { name: string; email: string } | null;
}

interface AuditLogSectionProps {
  table: string;
  recordId: string;
  // 「物件」「入居者」のような表示用ラベル（省略時はテーブル名）
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

export default function AuditLogSection({ table, recordId, recordLabel }: AuditLogSectionProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/audit-logs?table=${encodeURIComponent(table)}&record_id=${encodeURIComponent(recordId)}&limit=30`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (active) setLogs(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [table, recordId]);

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
          <ul className="space-y-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-3 text-[13px] py-1.5 border-b border-line last:border-0"
              >
                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${ACTION_COLOR[log.action]}`}>
                  {ACTION_LABEL[log.action]}
                </span>
                <span className="flex items-center gap-1 text-ink-2 flex-1 min-w-0">
                  <UserIcon size={12} className="text-ink-3 flex-shrink-0" />
                  <span className="truncate">
                    {log.user?.name ?? <span className="text-ink-3">システム</span>}
                  </span>
                </span>
                <span className="text-ink-3 text-[12px] flex-shrink-0">
                  {formatTime(log.created_at)}
                </span>
              </li>
            ))}
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
