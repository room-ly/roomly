import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ success: true });

  // Supabaseのauth cookieを確実に削除
  const cookieNames = [
    `sb-grtiixrpqwsvxsfapsni-auth-token`,
    `sb-grtiixrpqwsvxsfapsni-auth-token.0`,
    `sb-grtiixrpqwsvxsfapsni-auth-token.1`,
  ];
  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}
