"use client";

import { useEffect, useState } from "react";

type Row = {
  company_id: string;
  name: string;
  plan: string;
  max_units: number;
  is_demo: boolean;
  signed_up_at: string;
  user_count: number;
  ops_7d: number;
  ops_30d: number;
  ops_total: number;
  last_op_at: string | null;
  logins_ok: number;
  last_login_at: string | null;
  activity_status: "active" | "slowing" | "dormant" | "never";
  days_since_last_op: number | null;
};

const STATUS_META: Record<
  Row["activity_status"],
  { label: string; cls: string }
> = {
  active: { label: "稼働中", cls: "badge-ok" },
  slowing: { label: "鈍化", cls: "badge-warn" },
  dormant: { label: "停滞", cls: "badge-warn" },
  never: { label: "未稼働", cls: "badge-danger" },
};

const FILTERS = [
  { key: "free", label: "無料プランのみ" },
  { key: "all", label: "全プラン" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

export default function UsagePage() {
  const [filter, setFilter] = useState<FilterKey>("free");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const qs = filter === "free" ? "?plan=free" : "";
    fetch(`/api/company-activity${qs}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setRows(data.rows ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  // サマリー集計
  const summary = {
    total: rows.length,
    active: rows.filter((r) => r.activity_status === "active").length,
    never: rows.filter((r) => r.activity_status === "never").length,
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1">稼働状況</h1>
        <p className="text-sm text-ink-3">
          登録会社が実際にkanriを使っているか（操作数・最終操作日・ログイン）を一覧で確認します。
          操作数は <code>audit_logs</code> の書き込み回数ベース。
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              filter === f.key
                ? "bg-accent text-white border-accent"
                : "bg-surface text-ink-2 border-line hover:bg-surface-2"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!loading && !error && rows.length > 0 && (
        <div className="mb-4 flex gap-3 text-sm">
          <span className="text-ink-2">対象 {summary.total} 社</span>
          <span className="text-accent-deep">稼働中 {summary.active}</span>
          <span className="text-danger">未稼働 {summary.never}</span>
        </div>
      )}

      {loading && <div className="text-sm text-ink-3">読み込み中...</div>}
      {error && (
        <div className="text-sm text-danger bg-danger-tint border border-danger/20 rounded p-3 mb-4">
          {error === "Forbidden"
            ? "閲覧権限がありません。サーバーの ROOMLY_ADMIN_EMAILS にあなたのメールアドレスを追加してください。"
            : `エラー: ${error}`}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="text-sm text-ink-3">データがありません。</div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto border border-line rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-2 text-ink-2">
              <tr>
                <Th>会社</Th>
                <Th>状態</Th>
                <Th>プラン</Th>
                <Th right>7日</Th>
                <Th right>30日</Th>
                <Th right>累計</Th>
                <Th right>最終操作</Th>
                <Th right>ログイン</Th>
                <Th right>ユーザー</Th>
                <Th>登録日</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const meta = STATUS_META[r.activity_status];
                return (
                  <tr key={r.company_id} className="border-t border-line">
                    <td className="px-3 py-2 whitespace-nowrap font-medium">
                      {r.name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-ink-2">
                      {r.plan}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.ops_7d.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-2">
                      {r.ops_30d.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-2">
                      {r.ops_total.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap text-ink-2">
                      {r.days_since_last_op == null
                        ? "—"
                        : r.days_since_last_op === 0
                          ? "今日"
                          : `${r.days_since_last_op}日前`}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-2">
                      {r.logins_ok}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink-2">
                      {r.user_count}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-ink-3">
                      {r.signed_up_at?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: boolean;
}) {
  return (
    <th
      className={`px-3 py-2 font-medium whitespace-nowrap ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
