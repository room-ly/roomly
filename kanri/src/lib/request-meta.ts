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
  signup_path?: string | null;
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

// ローカル開発（Docker等）からのアクセスを本番分析から除外するための判定。
// プライベート/ループバックIP、IPv4-mapped IPv6（::ffff:192.168.x.x）も拾う。
export function isLocalIp(ip: string | null): boolean {
  if (!ip) return false;
  // ::ffff:192.168.65.1 のような IPv4-mapped IPv6 から素のIPv4を取り出す
  const v4 = ip.replace(/^::ffff:/i, "");
  if (v4 === "127.0.0.1" || v4 === "::1" || v4 === "0.0.0.0") return true;
  if (/^10\./.test(v4)) return true;
  if (/^192\.168\./.test(v4)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(v4)) return true; // 172.16.0.0/12
  if (/^169\.254\./.test(v4)) return true; // link-local
  if (/^(fc|fd)/i.test(ip)) return true; // IPv6 unique local
  return false;
}

// クローラ・ボットからのアクセスを本番分析から除外するための判定。
// Googlebot/bingbot 等は user-agent にこれらのトークンを含む。
const BOT_UA_RE =
  /bot|spider|crawl|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|whatsapp|telegrambot|headlesschrome|phantomjs|python-requests|curl\/|wget|go-http-client|axios\/|node-fetch/i;

export function isBotUserAgent(ua: string | null): boolean {
  if (!ua) return false;
  return BOT_UA_RE.test(ua);
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
    // 既知の導線値のみ許可（任意文字列でDBを汚さない）
    signup_path: ((): string | null => {
      const v = truncate(a.signup_path, 32);
      return v && /^[a-z0-9_]+$/.test(v) ? v : null;
    })(),
  };
}
