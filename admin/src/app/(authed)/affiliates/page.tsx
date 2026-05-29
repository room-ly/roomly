"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Affiliate = {
  id: string;
  code: string;
  name: string;
  email: string;
  status: string;
  prospect_type: string | null;
  commission_recurring_rate: number;
  commission_recurring_months: number;
  source: string;
  created_at: string;
  approved_at: string | null;
};

type Summary = {
  pending_affiliates: number;
  active_affiliates: number;
  pending_conversions_count: number;
  pending_conversions_amount_jpy: number;
  approved_conversions_count: number;
  approved_conversions_amount_jpy: number;
  total_referred_companies: number;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "承認待ち",
  active: "承認済み",
  suspended: "停止中",
  rejected: "拒否",
};

const PROSPECT_TYPE_LABEL: Record<string, string> = {
  blogger: "ブログ・メディア",
  influencer: "SNS・YouTube",
  community: "大家会・コミュニティ",
  professional: "士業",
  other: "その他",
};

export default function AdminAffiliatesPage() {
  const [rows, setRows] = useState<Affiliate[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("q", search);

    Promise.all([
      fetch(`/api/affiliates?${params}`).then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch(`/api/affiliates/summary`).then((r) => r.json()),
    ])
      .then(([listRes, sumRes]) => {
        setRows(listRes.rows ?? []);
        setSummary(sumRes);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-1">アフィリエイト管理</h1>
          <p className="text-sm text-ink-3">
            申込の承認・成果確認・自社からの直接登録ができます。
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn btn-primary text-sm"
        >
          ＋ 直接登録
        </button>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="承認待ち"
            value={summary.pending_affiliates.toLocaleString()}
            sub="件の申込"
            href="?status=pending"
          />
          <SummaryCard
            label="承認済み"
            value={summary.active_affiliates.toLocaleString()}
            sub="名のアフィリエイター"
          />
          <SummaryCard
            label="紹介有効化"
            value={summary.total_referred_companies.toLocaleString()}
            sub="社"
          />
          <SummaryCard
            label="未支払い報酬"
            value={`¥${(summary.pending_conversions_amount_jpy + summary.approved_conversions_amount_jpy).toLocaleString()}`}
            sub={`${summary.pending_conversions_count + summary.approved_conversions_count}件`}
          />
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-2 items-center">
        {(["", "pending", "active", "suspended", "rejected"] as const).map(
          (s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                statusFilter === s
                  ? "bg-accent text-white border-accent"
                  : "bg-surface text-ink-2 border-line hover:bg-surface-2"
              }`}
            >
              {s === "" ? "全て" : STATUS_LABEL[s]}
            </button>
          )
        )}
        <div className="flex-1 min-w-[200px]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="名前・メール・コードで検索"
          className="px-3 py-1.5 rounded-md text-sm border border-line bg-surface min-w-[260px]"
        />
        <button type="submit" className="btn btn-secondary text-sm">
          検索
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-2">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">名前</th>
              <th className="px-3 py-2 font-medium">メール</th>
              <th className="px-3 py-2 font-medium">コード</th>
              <th className="px-3 py-2 font-medium">種別</th>
              <th className="px-3 py-2 font-medium">報酬</th>
              <th className="px-3 py-2 font-medium">流入</th>
              <th className="px-3 py-2 font-medium">ステータス</th>
              <th className="px-3 py-2 font-medium">申込日</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-ink-3">
                  読み込み中...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-ink-3">
                  該当する申込はありません
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-line hover:bg-surface-2"
              >
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 text-ink-2">{r.email}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                <td className="px-3 py-2 text-ink-2">
                  {r.prospect_type
                    ? PROSPECT_TYPE_LABEL[r.prospect_type] ?? r.prospect_type
                    : "-"}
                </td>
                <td className="px-3 py-2 text-ink-2">
                  {r.commission_recurring_rate}% × {r.commission_recurring_months}ヶ月
                </td>
                <td className="px-3 py-2 text-ink-3 text-xs">
                  {r.source === "self_signup" ? "本人申込" : "直接登録"}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-2 text-ink-3 text-xs">
                  {new Date(r.created_at).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/affiliates/${r.id}`}
                    className="text-accent text-xs hover:underline"
                  >
                    詳細 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <CreateAffiliateModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-md border border-line bg-surface p-4">
      <div className="text-xs text-ink-3 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <div className="text-xs text-ink-3 mt-0.5">{sub}</div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block hover:opacity-80">
        {content}
      </Link>
    );
  }
  return content;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-300",
    active: "bg-emerald-100 text-emerald-700 border-emerald-300",
    suspended: "bg-zinc-100 text-zinc-700 border-zinc-300",
    rejected: "bg-red-100 text-red-700 border-red-300",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs border ${
        colors[status] ?? "bg-zinc-100 text-zinc-700 border-zinc-300"
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function CreateAffiliateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    prospect_type: "",
    website_url: "",
    notes: "",
    commission_recurring_rate: 20,
    commission_recurring_months: 24,
    status: "active",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          prospect_type: form.prospect_type || null,
          website_url: form.website_url || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "登録に失敗しました");
      }
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-3 border-b border-line flex items-center justify-between">
          <h2 className="font-medium">アフィリエイター直接登録</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink">
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="名前 *">
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-line bg-bg text-sm"
            />
          </Field>
          <Field label="メール *">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-line bg-bg text-sm"
            />
          </Field>
          <Field label="カテゴリ">
            <select
              value={form.prospect_type}
              onChange={(e) =>
                setForm({ ...form, prospect_type: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md border border-line bg-bg text-sm"
            >
              <option value="">未設定</option>
              {Object.entries(PROSPECT_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ウェブサイト">
            <input
              type="url"
              value={form.website_url}
              onChange={(e) =>
                setForm({ ...form, website_url: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md border border-line bg-bg text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="継続報酬率(%)">
              <input
                type="number"
                step="0.01"
                value={form.commission_recurring_rate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    commission_recurring_rate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-md border border-line bg-bg text-sm"
              />
            </Field>
            <Field label="継続月数">
              <input
                type="number"
                value={form.commission_recurring_months}
                onChange={(e) =>
                  setForm({
                    ...form,
                    commission_recurring_months: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-md border border-line bg-bg text-sm"
              />
            </Field>
          </div>
          <Field label="ステータス">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-line bg-bg text-sm"
            >
              <option value="active">承認済み(active)</option>
              <option value="pending">承認待ち(pending)</option>
            </select>
          </Field>
          <Field label="運営メモ">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-line bg-bg text-sm"
            />
          </Field>
          {error && (
            <div className="p-2 rounded bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-sm"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {submitting ? "登録中..." : "登録する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-ink-2 mb-1">{label}</div>
      {children}
    </label>
  );
}
