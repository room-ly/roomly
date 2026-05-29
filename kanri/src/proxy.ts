import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// kanri.roomly.jp と admin.roomly.jp の単一プロジェクト・ホスト分割。
// - admin.roomly.jp: /admin/* と /api/admin/* のみ受ける。それ以外は404。
// - kanri.roomly.jp (本番) と localhost (開発) は /admin/* /api/admin/* を404にする。
// - /api/cron/* はVercel Cron経由でホスト固定されないため、どちらでも素通り。
function adminHostRouting(request: NextRequest): NextResponse | null {
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0];
  const path = request.nextUrl.pathname;
  const isAdminPath =
    path.startsWith("/admin") || path.startsWith("/api/admin");

  const isAdminHost = host === "admin.roomly.jp";
  // 本番kanriホスト判定。preview/プレビューや localhost は admin/kanri 両用で動かせるよう許可
  const isKanriProdHost = host === "kanri.roomly.jp";

  if (isAdminHost && !isAdminPath) {
    // adminドメインでadmin以外のパスにアクセス → 404
    // /_next, /favicon, /api/cron などのインフラパスは許可
    const allowed =
      path.startsWith("/_next") ||
      path.startsWith("/api/cron") ||
      path === "/favicon.ico" ||
      path === "/robots.txt" ||
      path.includes(".");
    if (!allowed) {
      return new NextResponse(null, { status: 404 });
    }
  }

  if (isKanriProdHost && isAdminPath) {
    // kanri.roomly.jp でadmin系パスにアクセス → 404（URLバレ防止）
    return new NextResponse(null, { status: 404 });
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const hostRouteResponse = adminHostRouting(request);
  if (hostRouteResponse) return hostRouteResponse;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未認証なら /login にリダイレクト
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/signup") &&
    !request.nextUrl.pathname.startsWith("/reset-password") &&
    !request.nextUrl.pathname.startsWith("/update-password") &&
    !request.nextUrl.pathname.startsWith("/auth/") &&
    !request.nextUrl.pathname.startsWith("/_next") &&
    !request.nextUrl.pathname.startsWith("/api") &&
    !request.nextUrl.pathname.includes(".")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 認証済みで /login にアクセスしたらトップへ
  const authPaths = ["/login", "/signup", "/reset-password"];
  if (user && authPaths.some((p) => request.nextUrl.pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
