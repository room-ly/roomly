import { NextRequest, NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 必要な環境変数:
// - GA4_PROPERTY_ID                    (数値、ハイフンなし。例: 123456789)
// - GA4_SA_CLIENT_EMAIL                (Service Accountのメール)
// - GA4_SA_PRIVATE_KEY                 (PEM。改行は \n でもOK)

type Summary = {
  active_users: number;
  sessions: number;
  page_views: number;
  conversions: number;
  avg_session_duration_sec: number;
};

type DailyRow = {
  date: string;
  active_users: number;
  sessions: number;
  page_views: number;
  conversions: number;
};

type ChannelRow = {
  channel: string;
  sessions: number;
  active_users: number;
  conversions: number;
};

type PageRow = {
  path: string;
  page_views: number;
  active_users: number;
};

function getClient(): BetaAnalyticsDataClient {
  const privateKey = (process.env.GA4_SA_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GA4_SA_CLIENT_EMAIL!,
      private_key: privateKey,
    },
  });
}

export async function GET(request: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const required = ["GA4_PROPERTY_ID", "GA4_SA_CLIENT_EMAIL", "GA4_SA_PRIVATE_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return NextResponse.json({ error: "not_configured", missing }, { status: 503 });
  }

  const days = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10), 1),
    90
  );

  const property = `properties/${process.env.GA4_PROPERTY_ID}`;
  const dateRange = { startDate: `${days}daysAgo`, endDate: "today" };

  try {
    const client = getClient();

    const [summaryRes, dailyRes, channelRes, pageRes] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [dateRange],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "conversions" },
          { name: "averageSessionDuration" },
        ],
      }),
      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "conversions" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "conversions" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 20,
      }),
      client.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 30,
      }),
    ]);

    const sRow = summaryRes[0].rows?.[0]?.metricValues ?? [];
    const summary: Summary = {
      active_users: Number(sRow[0]?.value ?? 0),
      sessions: Number(sRow[1]?.value ?? 0),
      page_views: Number(sRow[2]?.value ?? 0),
      conversions: Number(sRow[3]?.value ?? 0),
      avg_session_duration_sec: Math.round(Number(sRow[4]?.value ?? 0)),
    };

    const daily: DailyRow[] = (dailyRes[0].rows ?? []).map((r) => {
      const d = r.dimensionValues?.[0]?.value ?? "";
      // YYYYMMDD → YYYY-MM-DD
      const date = d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;
      const m = r.metricValues ?? [];
      return {
        date,
        active_users: Number(m[0]?.value ?? 0),
        sessions: Number(m[1]?.value ?? 0),
        page_views: Number(m[2]?.value ?? 0),
        conversions: Number(m[3]?.value ?? 0),
      };
    });

    const channels: ChannelRow[] = (channelRes[0].rows ?? []).map((r) => {
      const m = r.metricValues ?? [];
      return {
        channel: r.dimensionValues?.[0]?.value ?? "(unknown)",
        sessions: Number(m[0]?.value ?? 0),
        active_users: Number(m[1]?.value ?? 0),
        conversions: Number(m[2]?.value ?? 0),
      };
    });

    const pages: PageRow[] = (pageRes[0].rows ?? []).map((r) => {
      const m = r.metricValues ?? [];
      return {
        path: r.dimensionValues?.[0]?.value ?? "",
        page_views: Number(m[0]?.value ?? 0),
        active_users: Number(m[1]?.value ?? 0),
      };
    });

    return NextResponse.json({ days, summary, daily, channels, pages });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
