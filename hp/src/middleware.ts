import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// hp は基本的に公開ページ。Supabaseセッション(Cookie)の自動リフレッシュだけ行い、
// アクセス制御は各ページ/APIで個別に行う。
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (
    !process.env.ROOMLY_SUPABASE_URL ||
    !process.env.ROOMLY_SUPABASE_ANON_KEY
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.ROOMLY_SUPABASE_URL,
    process.env.ROOMLY_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // セッションをリフレッシュするためにgetUserを呼ぶ
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // _next, favicon, 画像、static は除外
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
