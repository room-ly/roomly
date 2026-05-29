import type { NextRequest } from "next/server";
import { createServiceRoleClient } from "./supabase-server";

export type TrackingMeta = {
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  landing_path: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  ga_client_id: string | null;
};

export function extractTrackingMeta(
  request: NextRequest,
  body: Record<string, unknown>
): TrackingMeta {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  return {
    ip_address: ip,
    user_agent: request.headers.get("user-agent") || null,
    referrer: (body.referrer as string) || null,
    landing_path: (body.landing_path as string) || null,
    utm_source: (body.utm_source as string) || null,
    utm_medium: (body.utm_medium as string) || null,
    utm_campaign: (body.utm_campaign as string) || null,
    utm_term: (body.utm_term as string) || null,
    utm_content: (body.utm_content as string) || null,
    gclid: (body.gclid as string) || null,
    ga_client_id: (body.ga_client_id as string) || null,
  };
}

export async function logSignupAttempt(
  meta: TrackingMeta,
  payload: {
    email: string | null;
    success: boolean;
    error_code?: string | null;
    error_message?: string | null;
    affiliate_code?: string | null;
  }
) {
  try {
    const admin = createServiceRoleClient();
    await admin.from("affiliate_signup_attempts").insert({
      email: payload.email,
      success: payload.success,
      error_code: payload.error_code || null,
      error_message: payload.error_message || null,
      affiliate_code: payload.affiliate_code || null,
      ...meta,
    });
  } catch (e) {
    console.error("logSignupAttempt error:", e);
  }
}

export async function logLoginAttempt(
  meta: TrackingMeta,
  payload: {
    email: string | null;
    success: boolean;
    affiliate_code?: string | null;
  }
) {
  try {
    const admin = createServiceRoleClient();
    await admin.from("affiliate_login_attempts").insert({
      email: payload.email,
      success: payload.success,
      affiliate_code: payload.affiliate_code || null,
      ...meta,
    });
  } catch (e) {
    console.error("logLoginAttempt error:", e);
  }
}
