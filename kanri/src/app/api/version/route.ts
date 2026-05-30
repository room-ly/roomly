import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const buildId =
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    "dev";
  return NextResponse.json(
    { buildId },
    { headers: { "Cache-Control": "no-store" } }
  );
}
