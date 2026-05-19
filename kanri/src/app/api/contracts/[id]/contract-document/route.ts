import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { formatPhone } from "@/lib/phone";
import { escapeHtml } from "@/lib/escape-html";

function e(val: any): string {
  return escapeHtml(String(val ?? ""));
}

function yen(val: any): string {
  const n = Number(val);
  return isNaN(n) ? "—" : `¥${n.toLocaleString()}`;
}

function dateStr(val: any): string {
  if (!val) return "";
  const d = new Date(val);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const contractTypeLabel: Record<string, string> = {
  fixed: "定期建物賃貸借契約",
  ordinary: "建物賃貸借契約",
};

const paymentMethodLabel: Record<string, string> = {
  transfer: "銀行振込",
  debit: "口座振替",
  card: "クレジットカード",
  cash: "現金持参",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const companyId = await getCompanyId();

    const { data: contract, error } = await supabase
      .from("contracts")
      .select(
        `*,
         tenant:tenants(*),
         unit:units(*, property:properties(*, owner:owners(name, phone, postal_code, address)))`
      )
      .eq("id", id)
      .single();

    if (error || !contract) {
      return NextResponse.json({ error: "契約データが見つかりません" }, { status: 404 });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("name, postal_code, address, phone")
      .eq("id", companyId)
      .single();

    const tenant = contract.tenant as Record<string, any> | null;
    const unit = contract.unit as Record<string, any> | null;
    const property = unit?.property as Record<string, any> | null;
    const owner = property?.owner as Record<string, any> | null;

    const title = contractTypeLabel[contract.contract_type] || "建物賃貸借契約書";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${e(title)} - ${e(property?.name)} ${e(unit?.unit_number)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS PMincho", serif;
      font-size: 13px;
      color: #333;
      max-width: 740px;
      margin: 0 auto;
      padding: 40px 40px 60px;
      line-height: 1.8;
    }
    h1 {
      text-align: center;
      font-size: 20px;
      letter-spacing: 0.3em;
      margin-bottom: 24px;
      padding-bottom: 8px;
      border-bottom: 2px solid #333;
    }
    h2 {
      font-size: 14px;
      margin: 24px 0 8px;
      padding: 4px 8px;
      background: #f5f5f5;
      border-left: 3px solid #333;
    }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; }
    th, td { border: 1px solid #999; padding: 6px 10px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; width: 140px; font-weight: 600; white-space: nowrap; font-size: 12px; }
    td { font-size: 13px; }
    .preamble { margin-bottom: 20px; text-indent: 1em; font-size: 13px; }
    .article { margin: 12px 0; }
    .article-title { font-weight: bold; margin-bottom: 4px; }
    .article-body { padding-left: 1em; }
    .seal-area {
      display: inline-block; width: 44px; height: 44px;
      border: 1px solid #ccc; border-radius: 50%;
      text-align: center; line-height: 44px;
      font-size: 9px; color: #ccc; margin-left: 6px; vertical-align: middle;
    }
    .sig-block { margin-top: 40px; }
    .sig-row { display: flex; justify-content: space-between; margin: 20px 0; gap: 32px; }
    .sig-col { flex: 1; line-height: 2; }
    .sig-label { font-weight: bold; font-size: 12px; margin-bottom: 4px; border-bottom: 1px solid #ccc; }
    .footer-note { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
    @media print {
      body { margin: 0; padding: 15mm 12mm; font-size: 11px; }
      h1 { font-size: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${e(title)}書</h1>

  <p class="preamble">
    賃貸人 ${e(owner?.name || "（未設定）")}（以下「甲」という）と賃借人 ${e(tenant?.name || "（未設定）")}（以下「乙」という）は、
    ${e(company?.name || "")}（以下「管理会社」という）の仲介のもと、以下のとおり${e(contractTypeLabel[contract.contract_type] || "建物賃貸借契約")}を締結する。
  </p>

  <h2>第1条（賃貸借の目的物）</h2>
  <table>
    <tr><th>物件名称</th><td>${e(property?.name)}</td></tr>
    <tr><th>所在地</th><td>${e(property?.address)}</td></tr>
    <tr><th>部屋番号</th><td>${e(unit?.unit_number)}</td></tr>
    <tr><th>構造</th><td>${e(property?.structure)}</td></tr>
    <tr><th>間取り</th><td>${e(unit?.layout)}</td></tr>
    <tr><th>専有面積</th><td>${unit?.area_sqm ? `${e(unit.area_sqm)}㎡` : ""}</td></tr>
    <tr><th>築年</th><td>${property?.built_year ? `${e(property.built_year)}年${property?.built_month ? e(property.built_month) + "月" : ""}` : ""}</td></tr>
    <tr><th>設備</th><td>${e((unit?.equipment || []).join("、"))}</td></tr>
  </table>

  <h2>第2条（契約期間）</h2>
  <table>
    <tr><th>契約種別</th><td>${e(contractTypeLabel[contract.contract_type] || "")}</td></tr>
    <tr><th>契約期間</th><td>${dateStr(contract.start_date)} から ${contract.end_date ? dateStr(contract.end_date) : "期限の定めなし"} まで</td></tr>
    <tr><th>入居日</th><td>${dateStr(contract.move_in_date)}</td></tr>
  </table>
  ${contract.contract_type === "ordinary" ? `
  <div class="article">
    <div class="article-body">本契約は、期間満了の6ヶ月前までに甲または乙から書面による更新拒絶の通知がなされない限り、同一条件にて更新されるものとする。</div>
  </div>` : `
  <div class="article">
    <div class="article-body">本契約は定期建物賃貸借であり、期間満了により終了する。更新はないものとする。</div>
  </div>`}

  <h2>第3条（賃料等）</h2>
  <table>
    <tr><th>賃料（月額）</th><td>${yen(contract.rent)}</td></tr>
    <tr><th>共益費・管理費</th><td>${yen(contract.management_fee)}</td></tr>
    <tr><th>月額合計</th><td>${yen(Number(contract.rent) + Number(contract.management_fee))}</td></tr>
    <tr><th>敷金</th><td>${yen(contract.deposit)}</td></tr>
    <tr><th>礼金</th><td>${yen(contract.key_money)}</td></tr>
    <tr><th>更新料</th><td>${Number(contract.renewal_fee) > 0 ? yen(contract.renewal_fee) : "なし"}</td></tr>
    <tr><th>仲介手数料</th><td>${Number(contract.brokerage_fee) > 0 ? yen(contract.brokerage_fee) : "—"}</td></tr>
    <tr><th>支払方法</th><td>${e(contract.payment_method ? (paymentMethodLabel[contract.payment_method] || "") : "")}</td></tr>
    <tr><th>支払期日</th><td>${contract.payment_due_day ? `毎月${e(contract.payment_due_day)}日` : ""}</td></tr>
  </table>

  <h2>第4条（敷金）</h2>
  <div class="article">
    <div class="article-body">
      乙は、本契約から生じる一切の債務の担保として、敷金${yen(contract.deposit)}を甲に預託する。
      甲は、本物件の明渡し完了後、未払い賃料・原状回復費用等を控除した残額を、明渡しから1ヶ月以内に乙に返還する。
    </div>
  </div>

  <h2>第5条（禁止事項）</h2>
  <div class="article">
    <div class="article-body">
      乙は、甲の書面による承諾を得ることなく、以下の行為をしてはならない。<br>
      （1）本物件の全部または一部を第三者に転貸し、または賃借権を譲渡すること<br>
      （2）本物件の増築、改築、改造、または模様替えを行うこと<br>
      （3）本物件を住居以外の目的に使用すること<br>
      （4）近隣に迷惑を及ぼす行為を行うこと<br>
      （5）危険物または不衛生な物品を持ち込むこと
    </div>
  </div>

  <h2>第6条（修繕）</h2>
  <div class="article">
    <div class="article-body">
      甲は、本物件の維持保全に必要な修繕を行う義務を負う。ただし、乙の故意または過失による損耗・毀損の修繕費用は乙の負担とする。
    </div>
  </div>

  <h2>第7条（契約の解除）</h2>
  <div class="article">
    <div class="article-body">
      甲は、乙が以下のいずれかに該当した場合、催告の上、本契約を解除することができる。<br>
      （1）賃料等の支払いを2ヶ月以上滞納したとき<br>
      （2）第5条の禁止事項に違反したとき<br>
      （3）その他、本契約に違反し、信頼関係が破壊されたと認められるとき
    </div>
  </div>

  <h2>第8条（中途解約）</h2>
  <div class="article">
    <div class="article-body">
      乙は、解約希望日の少なくとも1ヶ月前までに甲に書面で通知することにより、本契約を中途解約することができる。
    </div>
  </div>

  <h2>第9条（明渡し・原状回復）</h2>
  <div class="article">
    <div class="article-body">
      乙は、本契約の終了時に、本物件を原状に回復した上で甲に明け渡すものとする。
      原状回復の範囲は、国土交通省「原状回復をめぐるトラブルとガイドライン」に準拠する。
    </div>
  </div>

  ${contract.special_terms ? `
  <h2>第10条（特約事項）</h2>
  <div class="article">
    <div class="article-body" style="white-space: pre-wrap;">${e(contract.special_terms)}</div>
  </div>` : ""}

  <h2>保証人</h2>
  <table>
    <tr><th>保証人氏名</th><td>${e(contract.guarantor_name || tenant?.guarantor_name || "")}</td></tr>
    <tr><th>保証人電話</th><td>${e(formatPhone(contract.guarantor_phone || tenant?.guarantor_phone) || "")}</td></tr>
    <tr><th>保証人住所</th><td>${e(tenant?.guarantor_address || "")}</td></tr>
    <tr><th>保証人勤務先</th><td>${e(tenant?.guarantor_workplace || "")}</td></tr>
  </table>

  ${contract.insurance_company ? `
  <h2>保険</h2>
  <table>
    <tr><th>保険会社</th><td>${e(contract.insurance_company)}</td></tr>
  </table>` : ""}

  <div class="sig-block">
    <p style="text-align: center; margin-bottom: 16px; font-size: 12px;">
      本契約の成立を証するため、本書2通を作成し、甲乙各1通を保有する。
    </p>
    <p style="text-align: right; margin-bottom: 20px;">
      ${contract.signed_date ? dateStr(contract.signed_date) : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;年&nbsp;&nbsp;&nbsp;&nbsp;月&nbsp;&nbsp;&nbsp;&nbsp;日"}
    </p>

    <div class="sig-row">
      <div class="sig-col">
        <div class="sig-label">甲（賃貸人）</div>
        <p>住所：${e(owner?.address || "")}</p>
        <p>氏名：${e(owner?.name || "")}<span class="seal-area">印</span></p>
        <p>電話：${e(formatPhone(owner?.phone) || "")}</p>
      </div>
      <div class="sig-col">
        <div class="sig-label">乙（賃借人）</div>
        <p>住所：${e(tenant?.address || "")}</p>
        <p>氏名：${e(tenant?.name || "")}<span class="seal-area">印</span></p>
        <p>電話：${e(formatPhone(tenant?.phone) || "")}</p>
      </div>
    </div>

    <div class="sig-row">
      <div class="sig-col">
        <div class="sig-label">管理会社</div>
        <p>${e(company?.name || "")}</p>
        <p>住所：${company?.postal_code ? "〒" + e(company.postal_code) + " " : ""}${e(company?.address || "")}</p>
        <p>電話：${e(formatPhone(company?.phone) || "")}</p>
      </div>
      <div class="sig-col">
        <div class="sig-label">連帯保証人</div>
        <p>住所：${e(tenant?.guarantor_address || "")}</p>
        <p>氏名：${e(contract.guarantor_name || tenant?.guarantor_name || "")}<span class="seal-area">印</span></p>
        <p>電話：${e(formatPhone(contract.guarantor_phone || tenant?.guarantor_phone) || "")}</p>
      </div>
    </div>
  </div>

  <p class="footer-note">
    本書は${e(company?.name || "")}が管理するシステムより出力されました
  </p>

  <script>window.print();</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
