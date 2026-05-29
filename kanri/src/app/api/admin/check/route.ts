import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase-server";

function isRoomlyAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ROOMLY_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.length > 0 && list.includes(email.toLowerCase());
}

export async function GET() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json({ isAdmin: isRoomlyAdmin(user?.email) });
}
