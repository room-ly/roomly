"use client";

import { useEffect, useState } from "react";

type AdsSummary = {
  cost_jpy: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cost_per_conversion_jpy: number | null;
};
type AdsCampaign = {
  campaign_id: string;
  campaign_name: string;
  status: string;
  cost_jpy: number;
  impressions: number;
  clicks: number;
  conversions: number;
};
type AdsKeyword = {
  keyword: string;
  match_type: string;
  cost_jpy: number;
  impressions: number;
  clicks: number;
  conversions: number;
};
type AdsResponse = {
  days: number;
  summary: AdsSummary;
  campaigns: AdsCampaign[];
  keywords: AdsKeyword[];
};

type Ga4Summary = {
  active_users: number;
  sessions: number;
  page_views: number;
  conversions: number;
  avg_session_duration_sec: number;
};
type Ga4Channel = { channel: string; sessions: number; active_users: number; conversions: number };
type Ga4Page = { path: string; page_views: number; active_users: number };
type Ga4Response = {
  days: number;
  summary: Ga4Summary;
  channels: Ga4Channel[];
  pages: Ga4Page[];
};

type ApiError = { error: string; missing?: string[] };

const DAY_OPTIONS = [7, 14, 30] as const;

export default function MarketingPage() {
  const [days, setDays] = useState<number>(30);
  const [ads, setAds] = useState<AdsResponse | null>(null);
  const [adsErr, setAdsErr] = useState<ApiError | null>(null);
  const [adsLoading, setAdsLoading] = useState(false);
  const [ga4, setGa4] = useState<Ga4Response | null>(null);
  const [ga4Err, setGa4Err] = useState<ApiError | null>(null);
  const [ga4Loading, setGa4Loading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAdsLoading(true);
    setAdsErr(null);
    fetch(`/api/google-ads?days=${days}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw body;
        return body;
      })
      .then((d) => !cancelled && setAds(d))
      .catch((e) => !cancelled && (setAdsErr(e), setAds(null)))
      .finally(() => !cancelled && setAdsLoading(false));

    setGa4Loading(true);
    setGa4Err(null);
    fetch(`/api/ga4?days=${days}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw body;
        return body;
      })
      .then((d) => !cancelled && setGa4(d))
      .catch((e) => !cancelled && (setGa4Err(e), setGa4(null)))
      .finally(() => !cancelled && setGa4Loading(false));

    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-1">マーケティング</h1>
          <p className="text-sm text-ink-3">Google広告とGoogle Analytics 4の集計を表示します。</p>
        </div>
        <div className="flex gap-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                days === d
                  ? "bg-accent text-white border-accent"
                  : "bg-surface text-ink-2 border-line hover:bg-surface-2"
              }`}
            >
              {d}日
            </button>
          ))}
        </div>
      </div>

      <Section title="Google広告">
        {adsLoading && <Loading />}
        {adsErr && <ErrorBox err={adsErr} envHint="GOOGLE_ADS_*" />}
        {ads && (
          <>
            <SummaryGrid
              cards={[
                { label: "広告費", value: yen(ads.summary.cost_jpy) },
                { label: "表示回数", value: num(ads.summary.impressions) },
                { label: "クリック", value: num(ads.summary.clicks) },
                { label: "CTR", value: `${(ads.summary.ctr * 100).toFixed(2)}%` },
                { label: "コンバージョン", value: num(ads.summary.conversions) },
                {
                  label: "CV単価",
                  value: ads.summary.cost_per_conversion_jpy != null
                    ? yen(ads.summary.cost_per_conversion_jpy)
                    : "—",
                },
              ]}
            />
            <SubTitle>キャンペーン別</SubTitle>
            <DataTable
              columns={[
                { key: "campaign_name", label: "キャンペーン" },
                { key: "status", label: "状態" },
                { key: "cost_jpy", label: "広告費", format: yen, align: "right" },
                { key: "impressions", label: "表示", format: num, align: "right" },
                { key: "clicks", label: "クリック", format: num, align: "right" },
                { key: "conversions", label: "CV", format: num, align: "right" },
              ]}
              rows={ads.campaigns}
            />
            <SubTitle>キーワード別 TOP50</SubTitle>
            <DataTable
              columns={[
                { key: "keyword", label: "キーワード" },
                { key: "match_type", label: "マッチタイプ" },
                { key: "cost_jpy", label: "広告費", format: yen, align: "right" },
                { key: "impressions", label: "表示", format: num, align: "right" },
                { key: "clicks", label: "クリック", format: num, align: "right" },
                { key: "conversions", label: "CV", format: num, align: "right" },
              ]}
              rows={ads.keywords}
            />
          </>
        )}
      </Section>

      <Section title="Google Analytics 4">
        {ga4Loading && <Loading />}
        {ga4Err && <ErrorBox err={ga4Err} envHint="GA4_*" />}
        {ga4 && (
          <>
            <SummaryGrid
              cards={[
                { label: "アクティブユーザー", value: num(ga4.summary.active_users) },
                { label: "セッション", value: num(ga4.summary.sessions) },
                { label: "ページビュー", value: num(ga4.summary.page_views) },
                { label: "コンバージョン", value: num(ga4.summary.conversions) },
                { label: "平均セッション時間", value: `${ga4.summary.avg_session_duration_sec}秒` },
              ]}
            />
            <SubTitle>流入チャネル別</SubTitle>
            <DataTable
              columns={[
                { key: "channel", label: "チャネル" },
                { key: "sessions", label: "セッション", format: num, align: "right" },
                { key: "active_users", label: "ユーザー", format: num, align: "right" },
                { key: "conversions", label: "CV", format: num, align: "right" },
              ]}
              rows={ga4.channels}
            />
            <SubTitle>人気ページ TOP30</SubTitle>
            <DataTable
              columns={[
                { key: "path", label: "パス" },
                { key: "page_views", label: "PV", format: num, align: "right" },
                { key: "active_users", label: "ユーザー", format: num, align: "right" },
              ]}
              rows={ga4.pages}
            />
          </>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-semibold mb-3 border-b border-line pb-2">{title}</h2>
      {children}
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-medium text-ink-2 mt-5 mb-2">{children}</h3>;
}

function Loading() {
  return <div className="text-sm text-ink-3">読み込み中...</div>;
}

function ErrorBox({ err, envHint }: { err: ApiError; envHint: string }) {
  if (err.error === "not_configured") {
    return (
      <div className="text-sm bg-warning-tint border border-warning/20 rounded p-3">
        未設定です。以下の環境変数をVercelに登録してください: <code>{(err.missing ?? []).join(", ") || envHint}</code>
      </div>
    );
  }
  if (err.error === "Forbidden") {
    return (
      <div className="text-sm bg-danger-tint border border-danger/20 rounded p-3">
        閲覧権限がありません。
      </div>
    );
  }
  return (
    <div className="text-sm bg-danger-tint border border-danger/20 rounded p-3">
      エラー: {err.error}
    </div>
  );
}

type Card = { label: string; value: string };
function SummaryGrid({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="border border-line rounded-lg bg-surface p-3">
          <div className="text-xs text-ink-3 mb-1">{c.label}</div>
          <div className="text-lg font-semibold">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

type Col<T> = {
  key: keyof T & string;
  label: string;
  format?: (v: unknown) => string;
  align?: "left" | "right";
};
function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
}: {
  columns: Col<T>[];
  rows: T[];
}) {
  if (rows.length === 0) return <div className="text-sm text-ink-3">データがありません。</div>;
  return (
    <div className="overflow-x-auto border border-line rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-surface-2 text-ink-2">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2 font-medium whitespace-nowrap ${
                  c.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-2 whitespace-nowrap ${
                    c.align === "right" ? "text-right tabular-nums" : "text-left"
                  }`}
                >
                  {(c.format ?? defaultFmt)(r[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function defaultFmt(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number") return v.toLocaleString();
  return String(v);
}
function num(v: unknown): string {
  return Number(v ?? 0).toLocaleString();
}
function yen(v: unknown): string {
  return `¥${Number(v ?? 0).toLocaleString()}`;
}
