import { NextRequest } from "next/server";

export type RequestMeta = {
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  user_agent: string | null;
};

export type Attribution = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  referrer?: string | null;
  landing_path?: string | null;
  ga_client_id?: string | null;
  affiliate_code?: string | null;
  visitor_id?: string | null;
};

// Vercelの地理情報ヘッダはURLエンコードされている場合がある
function decode(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getRequestMeta(request: NextRequest): RequestMeta {
  const h = request.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;
  return {
    ip_address: ip,
    country: decode(h.get("x-vercel-ip-country")),
    region: decode(h.get("x-vercel-ip-country-region")),
    city: decode(h.get("x-vercel-ip-city")),
    user_agent: h.get("user-agent"),
  };
}

export function truncate(value: unknown, max = 255): string | null {
  if (typeof value !== "string") return null;
  if (value.length === 0) return null;
  return value.slice(0, max);
}

export function normalizeAttribution(input: unknown): Attribution {
  if (!input || typeof input !== "object") return {};
  const a = input as Record<string, unknown>;
  const affiliateCodeRaw = truncate(a.affiliate_code, 16);
  const affiliateCode =
    affiliateCodeRaw && /^[A-Z0-9]{4,16}$/.test(affiliateCodeRaw)
      ? affiliateCodeRaw
      : null;
  return {
    utm_source: truncate(a.utm_source),
    utm_medium: truncate(a.utm_medium),
    utm_campaign: truncate(a.utm_campaign),
    utm_term: truncate(a.utm_term),
    utm_content: truncate(a.utm_content),
    gclid: truncate(a.gclid),
    referrer: truncate(a.referrer, 2000),
    landing_path: truncate(a.landing_path, 2000),
    ga_client_id: truncate(a.ga_client_id),
    affiliate_code: affiliateCode,
    visitor_id: truncate(a.visitor_id, 64),
  };
}
