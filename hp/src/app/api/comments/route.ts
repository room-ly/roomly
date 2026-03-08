import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.INQUIRY_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.INQUIRY_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET(req: NextRequest) {
  const project = req.nextUrl.searchParams.get("project");
  const slug = req.nextUrl.searchParams.get("slug");

  if (!project || !slug) {
    return NextResponse.json([], { status: 400 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/comments?project=eq.${encodeURIComponent(project)}&article_slug=eq.${encodeURIComponent(slug)}&approved=eq.true&order=created_at.asc&select=id,author_name,content,created_at`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: 30 },
    }
  );

  if (!res.ok) {
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project, article_slug, author_name, content } = body;

    if (!project || !article_slug || !author_name?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    if (author_name.length > 50 || content.length > 2000) {
      return NextResponse.json({ error: "文字数制限を超えています" }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        project,
        article_slug,
        author_name: author_name.trim(),
        content: content.trim(),
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }
}
