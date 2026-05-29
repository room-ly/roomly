import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRoomlyAdmin } from "@/lib/admin-auth";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export async function GET(request: NextRequest) {
  const auth = await requireRoomlyAdmin();
  if (!auth.ok) return auth.response;

  const status = request.nextUrl.searchParams.get("status");
  const search = request.nextUrl.searchParams.get("q");

  const admin = getAdmin();
  let query = admin
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,code.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data });
}

// 運営側からアフィリエイターを直接作成（自社からアプローチした人向け）
export async function POST(request: NextRequest) {
  const auth = await requireRoomlyAdmin();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!name || !email) {
    return NextResponse.json(
      { error: "name と email は必須です" },
      { status: 400 }
    );
  }

  const admin = getAdmin();

  let inserted = false;
  let attempt = 0;
  let lastError: unknown = null;
  let createdId: string | null = null;

  while (attempt < 5 && !inserted) {
    const code = generateCode();
    const { data, error } = await admin
      .from("affiliates")
      .insert({
        code,
        name,
        email,
        phone: body.phone ?? null,
        prospect_type: body.prospect_type ?? null,
        website_url: body.website_url ?? null,
        social_url: body.social_url ?? null,
        notes: body.notes ?? null,
        commission_initial_jpy: body.commission_initial_jpy ?? 0,
        commission_recurring_rate: body.commission_recurring_rate ?? 20.0,
        commission_recurring_months: body.commission_recurring_months ?? 24,
        status: body.status === "active" ? "active" : "pending",
        approved_at: body.status === "active" ? new Date().toISOString() : null,
        approved_by: body.status === "active" ? auth.userId : null,
        source: "manual",
      })
      .select()
      .single();
    if (!error) {
      inserted = true;
      createdId = data.id;
      break;
    }
    if (
      error.code === "23505" &&
      (error.message?.includes("affiliates_code_key") ||
        error.message?.includes("code"))
    ) {
      attempt++;
      lastError = error;
      continue;
    }
    console.error("admin create affiliate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!inserted) {
    console.error("affiliate code retry exhausted:", lastError);
    return NextResponse.json(
      { error: "コード生成失敗" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: createdId });
}
