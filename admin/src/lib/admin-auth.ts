import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase-server";

export function isRoomlyAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ROOMLY_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

export async function requireRoomlyAdmin(): Promise<
  { ok: true; email: string; userId: string } | { ok: false; response: NextResponse }
> {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isRoomlyAdmin(user?.email)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, email: user!.email!, userId: user!.id };
}

// ページ用: 非adminは/loginにリダイレクト or 404を返す判定
export async function getCurrentAdminUser(): Promise<
  { email: string; userId: string } | null
> {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isRoomlyAdmin(user?.email)) return null;
  return { email: user!.email!, userId: user!.id };
}
