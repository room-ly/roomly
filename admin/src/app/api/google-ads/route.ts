import { NextRequest, NextResponse } from "next/server";
import { GoogleAdsApi } from "google-ads-api";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 必要な環境変数:
// - GOOGLE_ADS_DEVELOPER_TOKEN
// - GOOGLE_ADS_OAUTH_CLIENT_ID
// - GOOGLE_ADS_OAUTH_CLIENT_SECRET
// - GOOGLE_ADS_REFRESH_TOKEN
// - GOOGLE_ADS_LOGIN_CUSTOMER_ID  (MCC, ハイフンなし。例: 3928058323)
// - GOOGLE_ADS_CUSTOMER_ID         (対象アカウント, ハイフンなし。例: 4382998899)

type Summary = {
  cost_jpy: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cost_per_conversion_jpy: number | null;
};

type DailyRow = {
  date: string;
  cost_jpy: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

type CampaignRow = {
  campaign_id: string;
  campaign_name: string;
  status: string;
  cost_jpy: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

type KeywordRow = {
  keyword: string;
  match_type: string;
  cost_jpy: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

export async function GET(request: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const required = [
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_OAUTH_CLIENT_ID",
    "GOOGLE_ADS_OAUTH_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
    "GOOGLE_ADS_CUSTOMER_ID",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "not_configured", missing },
      { status: 503 }
    );
  }

  const days = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10), 1),
    90
  );

  try {
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_OAUTH_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });

    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    });

    const dateRange = `DURING LAST_${days === 7 ? "7" : days === 14 ? "14" : "30"}_DAYS`;
    // LAST_N_DAYS は 7/14/30 のみサポート。それ以外は明示範囲
    const useExplicitRange = ![7, 14, 30].includes(days);
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const rangeClause = useExplicitRange
      ? `segments.date BETWEEN '${fmt(start)}' AND '${fmt(end)}'`
      : dateRange.replace("DURING ", "");

    const dailyQuery = `
      SELECT segments.date, metrics.cost_micros, metrics.impressions,
             metrics.clicks, metrics.conversions
      FROM customer
      WHERE ${useExplicitRange ? rangeClause : `segments.date DURING LAST_${days}_DAYS`}
      ORDER BY segments.date
    `;

    const campaignQuery = `
      SELECT campaign.id, campaign.name, campaign.status,
             metrics.cost_micros, metrics.impressions,
             metrics.clicks, metrics.conversions
      FROM campaign
      WHERE ${useExplicitRange ? rangeClause : `segments.date DURING LAST_${days}_DAYS`}
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `;

    const keywordQuery = `
      SELECT ad_group_criterion.keyword.text,
             ad_group_criterion.keyword.match_type,
             metrics.cost_micros, metrics.impressions,
             metrics.clicks, metrics.conversions
      FROM keyword_view
      WHERE ${useExplicitRange ? rangeClause : `segments.date DURING LAST_${days}_DAYS`}
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `;

    const [dailyRaw, campaignRaw, keywordRaw] = await Promise.all([
      customer.query(dailyQuery),
      customer.query(campaignQuery),
      customer.query(keywordQuery),
    ]);

    const microsToJpy = (m: unknown) => Math.round(Number(m ?? 0) / 1_000_000);

    const daily: DailyRow[] = dailyRaw.map((r) => ({
      date: String(r.segments?.date ?? ""),
      cost_jpy: microsToJpy(r.metrics?.cost_micros),
      impressions: Number(r.metrics?.impressions ?? 0),
      clicks: Number(r.metrics?.clicks ?? 0),
      conversions: Number(r.metrics?.conversions ?? 0),
    }));

    const summary: Summary = daily.reduce(
      (acc, r) => {
        acc.cost_jpy += r.cost_jpy;
        acc.impressions += r.impressions;
        acc.clicks += r.clicks;
        acc.conversions += r.conversions;
        return acc;
      },
      { cost_jpy: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cost_per_conversion_jpy: null as number | null }
    );
    summary.ctr = summary.impressions > 0 ? summary.clicks / summary.impressions : 0;
    summary.cost_per_conversion_jpy =
      summary.conversions > 0 ? Math.round(summary.cost_jpy / summary.conversions) : null;

    const campaigns: CampaignRow[] = campaignRaw.map((r) => ({
      campaign_id: String(r.campaign?.id ?? ""),
      campaign_name: String(r.campaign?.name ?? ""),
      status: String(r.campaign?.status ?? ""),
      cost_jpy: microsToJpy(r.metrics?.cost_micros),
      impressions: Number(r.metrics?.impressions ?? 0),
      clicks: Number(r.metrics?.clicks ?? 0),
      conversions: Number(r.metrics?.conversions ?? 0),
    }));

    const keywords: KeywordRow[] = keywordRaw.map((r) => ({
      keyword: String(r.ad_group_criterion?.keyword?.text ?? ""),
      match_type: String(r.ad_group_criterion?.keyword?.match_type ?? ""),
      cost_jpy: microsToJpy(r.metrics?.cost_micros),
      impressions: Number(r.metrics?.impressions ?? 0),
      clicks: Number(r.metrics?.clicks ?? 0),
      conversions: Number(r.metrics?.conversions ?? 0),
    }));

    return NextResponse.json({ days, summary, daily, campaigns, keywords });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
