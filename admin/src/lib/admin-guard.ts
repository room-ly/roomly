import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function isRoomlyAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ROOMLY_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isRoomlyAdmin(user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
