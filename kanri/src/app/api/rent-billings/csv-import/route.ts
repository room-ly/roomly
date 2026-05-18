import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { createNotification } from "@/lib/notify";

interface CsvRow {
  date: string;
  amount: number;
  name: string;
  raw: string;
}

interface MatchResult {
  csv: CsvRow;
  billing_id: string | null;
  tenant_name: string | null;
  tenant_name_kana: string | null;
  unit_label: string | null;
  billing_month: string | null;
  total_amount: number | null;
  match_type: "exact" | "amount" | "name" | "none";
}

function parseCsvRow(line: string): string[] {
  const cols: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cols.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current.trim());
  return cols;
}

function parseCsvLines(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCsvRow(lines[0]);

  const dateIdx = header.findIndex((h) =>
    /日付|取引日|入金日|date/i.test(h)
  );
  const amountIdx = header.findIndex((h) =>
    /入金|金額|お預り金額|amount|credit/i.test(h)
  );
  const nameIdx = header.findIndex((h) =>
    /振込人|依頼人|摘要|名義|name|description|memo/i.test(h)
  );

  if (dateIdx === -1 || amountIdx === -1) return [];

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]);

    const amountStr = (cols[amountIdx] || "").replace(/[,¥￥\s]/g, "");
    const amount = Number(amountStr);
    if (!amount || amount <= 0) continue;

    rows.push({
      date: cols[dateIdx] || "",
      amount,
      name: nameIdx >= 0 ? (cols[nameIdx] || "") : "",
      raw: lines[i],
    });
  }
  return rows;
}

const HAN_KANA_MAP: Record<string, string> = {
  "ｦ":"ヲ","ｧ":"ァ","ｨ":"ィ","ｩ":"ゥ","ｪ":"ェ","ｫ":"ォ","ｬ":"ャ","ｭ":"ュ","ｮ":"ョ","ｯ":"ッ",
  "ｰ":"ー","ｱ":"ア","ｲ":"イ","ｳ":"ウ","ｴ":"エ","ｵ":"オ","ｶ":"カ","ｷ":"キ","ｸ":"ク","ｹ":"ケ","ｺ":"コ",
  "ｻ":"サ","ｼ":"シ","ｽ":"ス","ｾ":"セ","ｿ":"ソ","ﾀ":"タ","ﾁ":"チ","ﾂ":"ツ","ﾃ":"テ","ﾄ":"ト",
  "ﾅ":"ナ","ﾆ":"ニ","ﾇ":"ヌ","ﾈ":"ネ","ﾉ":"ノ","ﾊ":"ハ","ﾋ":"ヒ","ﾌ":"フ","ﾍ":"ヘ","ﾎ":"ホ",
  "ﾏ":"マ","ﾐ":"ミ","ﾑ":"ム","ﾒ":"メ","ﾓ":"モ","ﾔ":"ヤ","ﾕ":"ユ","ﾖ":"ヨ",
  "ﾗ":"ラ","ﾘ":"リ","ﾙ":"ル","ﾚ":"レ","ﾛ":"ロ","ﾜ":"ワ","ﾝ":"ン",
};
const DAKUTEN: Record<string, string> = {
  "カ":"ガ","キ":"ギ","ク":"グ","ケ":"ゲ","コ":"ゴ","サ":"ザ","シ":"ジ","ス":"ズ","セ":"ゼ","ソ":"ゾ",
  "タ":"ダ","チ":"ヂ","ツ":"ヅ","テ":"デ","ト":"ド","ハ":"バ","ヒ":"ビ","フ":"ブ","ヘ":"ベ","ホ":"ボ",
  "ウ":"ヴ",
};
const HANDAKUTEN: Record<string, string> = {
  "ハ":"パ","ヒ":"ピ","フ":"プ","ヘ":"ペ","ホ":"ポ",
};

function toFullWidthKana(s: string): string {
  let result = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const mapped = HAN_KANA_MAP[ch];
    if (mapped) {
      const next = s[i + 1];
      if (next === "ﾞ" && DAKUTEN[mapped]) {
        result += DAKUTEN[mapped];
        i++;
      } else if (next === "ﾟ" && HANDAKUTEN[mapped]) {
        result += HANDAKUTEN[mapped];
        i++;
      } else {
        result += mapped;
      }
    } else if (ch !== "ﾞ" && ch !== "ﾟ") {
      result += ch;
    }
  }
  return result;
}

function normalizeForMatch(s: string): string {
  let t = toFullWidthKana(s);
  t = t.replace(/[\s　（）()「」\-ー・]/g, "");
  t = t.replace(/[ぁ-ん]/g, (m) => String.fromCharCode(m.charCodeAt(0) + 0x60));
  return t.toUpperCase();
}

// マッチング: POST /api/rent-billings/csv-import?action=match
// 一括登録: POST /api/rent-billings/csv-import?action=apply
export async function POST(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get("action") || "match";

    if (action === "match") {
      return handleMatch(request);
    } else if (action === "apply") {
      return handleApply(request);
    }

    return NextResponse.json({ error: "無効なaction" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}

async function handleMatch(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const billingMonth = formData.get("billing_month") as string | null;

  if (!file) {
    return NextResponse.json({ error: "CSVファイルが必要です" }, { status: 400 });
  }

  const text = await file.text();
  const csvRows = parseCsvLines(text);

  if (csvRows.length === 0) {
    return NextResponse.json(
      { error: "CSVから入金データを読み取れませんでした。日付・金額カラムを含むCSVをアップロードしてください。" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // 未入金の請求を取得
  let query = supabase
    .from("rent_billings")
    .select(
      "id, billing_month, total_amount, status, contract:contracts(tenant:tenants(name, name_kana), unit:units(unit_number, property:properties(name))), rent_payments(amount)"
    )
    .in("status", ["unpaid", "partial", "overdue"]);

  if (billingMonth) {
    query = query.eq("billing_month", billingMonth);
  }

  const { data: billings, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const usedBillingIds = new Set<string>();

  const results: MatchResult[] = csvRows.map((csv) => {
    let bestMatch: (typeof billings)[number] | null = null;
    let matchType: MatchResult["match_type"] = "none";

    const csvNameNorm = normalizeForMatch(csv.name);

    for (const b of billings || []) {
      if (usedBillingIds.has(b.id)) continue;
      const tenant = (b.contract as any)?.tenant;
      const nameKana = tenant?.name_kana || "";
      const name = tenant?.name || "";
      const billingNameKanaNorm = normalizeForMatch(nameKana);
      const billingNameNorm = normalizeForMatch(name);

      const remaining = Number(b.total_amount) -
        ((b.rent_payments as any[]) || []).reduce(
          (s: number, p: { amount: number }) => s + Number(p.amount),
          0
        );

      const nameMatch =
        csvNameNorm &&
        (billingNameKanaNorm.includes(csvNameNorm) ||
          csvNameNorm.includes(billingNameKanaNorm) ||
          billingNameNorm.includes(csvNameNorm) ||
          csvNameNorm.includes(billingNameNorm));
      const amountMatch = csv.amount === remaining || csv.amount === Number(b.total_amount);

      if (nameMatch && amountMatch) {
        bestMatch = b;
        matchType = "exact";
        break;
      }
      if (nameMatch && matchType !== "name") {
        bestMatch = b;
        matchType = "name";
      }
      if (amountMatch && matchType === "none") {
        bestMatch = b;
        matchType = "amount";
      }
    }

    if (bestMatch) {
      usedBillingIds.add(bestMatch.id);
    }

    const tenant = bestMatch ? (bestMatch.contract as any)?.tenant : null;
    const unit = bestMatch ? (bestMatch.contract as any)?.unit : null;

    return {
      csv,
      billing_id: bestMatch?.id || null,
      tenant_name: tenant?.name || null,
      tenant_name_kana: tenant?.name_kana || null,
      unit_label: unit
        ? `${unit.property?.name || ""} ${unit.unit_number || ""}`
        : null,
      billing_month: bestMatch?.billing_month || null,
      total_amount: bestMatch ? Number(bestMatch.total_amount) : null,
      match_type: matchType,
    };
  });

  return NextResponse.json({ results, csv_count: csvRows.length });
}

async function handleApply(request: NextRequest) {
  const body = await request.json();
  const items: { billing_id: string; amount: number; payment_date: string }[] =
    body.items || [];

  if (items.length === 0) {
    return NextResponse.json({ error: "登録対象がありません" }, { status: 400 });
  }

  const uniqueBillingIds = new Set<string>();
  const deduped = items.filter((item) => {
    if (uniqueBillingIds.has(item.billing_id)) return false;
    uniqueBillingIds.add(item.billing_id);
    return true;
  });

  const supabase = await createClient();
  const company_id = await getCompanyId();
  let successCount = 0;
  const errors: string[] = [];

  for (const item of deduped) {
    // 現在の請求情報を取得
    const { data: billing, error: fetchError } = await supabase
      .from("rent_billings")
      .select("*, rent_payments(amount)")
      .eq("id", item.billing_id)
      .single();

    if (fetchError || !billing) {
      errors.push(`請求ID ${item.billing_id}: 見つかりません`);
      continue;
    }

    const existingPayments = ((billing.rent_payments as any[]) || []).reduce(
      (sum: number, p: { amount: number }) => sum + Number(p.amount),
      0
    );
    const newTotal = existingPayments + item.amount;
    const totalAmount = Number(billing.total_amount);

    const { error: paymentError } = await supabase
      .from("rent_payments")
      .insert({
        billing_id: item.billing_id,
        amount: item.amount,
        payment_method: "transfer",
        payment_date: item.payment_date,
        notes: "CSV一括取込",
        company_id,
      });

    if (paymentError) {
      errors.push(`請求ID ${item.billing_id}: ${paymentError.message}`);
      continue;
    }

    const newStatus = newTotal >= totalAmount ? "paid" : "partial";
    await supabase
      .from("rent_billings")
      .update({ status: newStatus })
      .eq("id", item.billing_id);

    successCount++;
  }

  if (successCount > 0) {
    await createNotification({
      title: `CSV一括入金: ${successCount}件登録しました`,
      type: "info",
      link: "/rent",
    });
  }

  return NextResponse.json({
    success: true,
    applied: successCount,
    errors,
  });
}
