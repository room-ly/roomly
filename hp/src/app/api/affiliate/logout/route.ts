import { NextResponse } from "next/server";
import { createAffiliateServerClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createAffiliateServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
