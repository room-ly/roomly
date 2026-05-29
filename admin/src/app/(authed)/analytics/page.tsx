"use client";

import { useEffect, useState } from "react";

type Row = Record<string, unknown>;

const VIEWS = [
  { key: "v_signup_funnel", label: "サインアップファネル（日別）" },
  { key: "v_signup_attribution", label: "サインアップ流入元別" },
  { key: "v_signup_by_geo", label: "サインアップ地域別" },
  { key: "v_login_daily", label: "ログイン日別" },
  { key: "v_login_by_geo", label: "ログイン地域別" },
  { key: "v_login_by_source", label: "ログイン流入元別" },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

export default function AnalyticsPage() {
  const [view, setView] = useState<ViewKey>("v_signup_funnel");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/analytics?view=${view}&limit=100`)
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
  }, [view]);

  const columns: string[] =
    rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1">運営者向け計測ダッシュボード</h1>
        <p className="text-sm text-ink-3">
          ログイン/サインアップの試行・流入元・地域別を確認します。閲覧には<code>ROOMLY_ADMIN_EMAILS</code>への登録が必要です。
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              view === v.key
                ? "bg-accent text-white border-accent"
                : "bg-surface text-ink-2 border-line hover:bg-surface-2"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

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
                {columns.map((c) => (
                  <th key={c} className="text-left px-3 py-2 font-medium whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-line">
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-2 whitespace-nowrap">
                      {formatCell(row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string") {
    // ISO日付っぽければ短縮表示
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 16).replace("T", " ");
    return v;
  }
  return JSON.stringify(v);
}
