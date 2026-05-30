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

function fee(val: any, unit: any, rent: any): string {
  const n = Number(val) || 0;
  if (unit === "months") {
    const jpy = Math.round(n * (Number(rent) || 0));
    return `賃料の${n}ヶ月分（¥${jpy.toLocaleString()}）`;
  }
  return yen(val);
}

function dateStr(val: any): string {
  if (!val) return "";
  const d = new Date(val);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function bool(val: any, trueLabel = "あり", falseLabel = "なし"): string {
  return val ? trueLabel : falseLabel;
}

const contractTypeLabel: Record<string, string> = {
  fixed: "定期建物賃貸借",
  ordinary: "普通建物賃貸借",
};

const paymentMethodLabel: Record<string, string> = {
  transfer: "銀行振込",
  debit: "口座振替",
  card: "クレジットカード",
  cash: "現金持参",
};

const managementFormLabel: Record<string, string> = {
  self: "自主管理",
  full_management: "全部委託",
  partial_management: "一部委託",
  sublet: "サブリース",
};

const landRightsLabel: Record<string, string> = {
  ownership: "所有権",
  leasehold: "借地権",
  sublease: "転借地権",
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
      .select("name, postal_code, address, phone, estate_license, estate_agent_name, estate_agent_license")
      .eq("id", companyId)
      .single();

    const tenant = contract.tenant as Record<string, any> | null;
    const unit = contract.unit as Record<string, any> | null;
    const property = unit?.property as Record<string, any> | null;
    const owner = property?.owner as Record<string, any> | null;

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>重要事項説明書 - ${e(property?.name)} ${e(unit?.unit_number)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS PMincho", serif;
      font-size: 12px;
      color: #333;
      max-width: 740px;
      margin: 0 auto;
      padding: 40px 40px 60px;
      line-height: 1.7;
    }
    h1 {
      text-align: center;
      font-size: 20px;
      letter-spacing: 0.3em;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 2px solid #333;
    }
    .subtitle {
      text-align: center;
      font-size: 11px;
      color: #666;
      margin-bottom: 24px;
    }
    h2 {
      font-size: 13px;
      margin: 20px 0 6px;
      padding: 4px 8px;
      background: #f5f5f5;
      border-left: 3px solid #333;
    }
    h3 {
      font-size: 12px;
      margin: 12px 0 4px;
      font-weight: bold;
    }
    table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; }
    th, td { border: 1px solid #999; padding: 5px 8px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; width: 140px; font-weight: 600; white-space: nowrap; font-size: 11px; }
    td { font-size: 12px; }
    .note { font-size: 11px; color: #666; margin: 4px 0; padding-left: 1em; }
    .hazard-yes { color: #c53030; font-weight: bold; }
    .hazard-no { color: #2f855a; }
    .preamble { margin-bottom: 16px; text-indent: 1em; font-size: 12px; }
    .sig-block { margin-top: 32px; }
    .sig-row { display: flex; justify-content: space-between; margin: 16px 0; gap: 24px; }
    .sig-col { flex: 1; line-height: 2; }
    .sig-label { font-weight: bold; font-size: 11px; margin-bottom: 4px; border-bottom: 1px solid #ccc; }
    .seal-area {
      display: inline-block; width: 40px; height: 40px;
      border: 1px solid #ccc; border-radius: 50%;
      text-align: center; line-height: 40px;
      font-size: 9px; color: #ccc; margin-left: 4px; vertical-align: middle;
    }
    .footer-note { margin-top: 32px; font-size: 10px; color: #999; text-align: center; }
    @media print {
      body { margin: 0; padding: 12mm 10mm; font-size: 10px; }
      h1 { font-size: 16px; }
      h2 { font-size: 11px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>重要事項説明書</h1>
  <p class="subtitle">宅地建物取引業法第35条に基づく重要事項の説明</p>

  <p class="preamble">
    宅地建物取引士が、賃借人となろうとする者に対し、賃貸借契約が成立するまでの間に、
    宅地建物取引業法第35条の規定に基づき、下記の重要事項について説明します。
  </p>

  <h2>Ⅰ. 対象となる宅地又は建物に関する事項</h2>

  <h3>1. 物件の表示</h3>
  <table>
    <tr><th>物件名称</th><td>${e(property?.name)}</td></tr>
    <tr><th>所在地</th><td>${e(property?.address)}</td></tr>
    <tr><th>部屋番号</th><td>${e(unit?.unit_number)}</td></tr>
    <tr><th>構造・階数</th><td>${e(property?.structure)} ${property?.floors ? e(property.floors) + "階建" : ""}${property?.underground_floors ? "（地下" + e(property.underground_floors) + "階）" : ""}</td></tr>
    <tr><th>間取り</th><td>${e(unit?.layout)}</td></tr>
    <tr><th>専有面積</th><td>${unit?.area_sqm ? `${e(unit.area_sqm)}㎡` : ""}</td></tr>
    <tr><th>築年月</th><td>${property?.built_year ? `${e(property.built_year)}年${property?.built_month ? e(property.built_month) + "月" : ""}` : ""}</td></tr>
    <tr><th>設備</th><td>${e((unit?.equipment || []).join("、"))}</td></tr>
  </table>

  <h3>2. 登記記録に記載された事項</h3>
  <table>
    <tr><th>登記名義人</th><td>${e(property?.registered_owner_name || owner?.name || "")}</td></tr>
    <tr><th>土地の権利</th><td>${e(landRightsLabel[property?.land_rights] || "")}</td></tr>
    <tr><th>抵当権の有無</th><td>${bool(property?.mortgage_exists)}</td></tr>
    ${property?.mortgage_exists ? `
    <tr><th>抵当権者</th><td>${e(property?.mortgagee)}</td></tr>
    <tr><th>債権額</th><td>${property?.mortgage_amount ? yen(property.mortgage_amount) : ""}</td></tr>` : ""}
  </table>
  ${property?.mortgage_exists ? `
  <p class="note">※ 抵当権が設定されている場合、競売により所有者が変更となる可能性があります。</p>` : ""}

  <h3>3. 法令に基づく制限</h3>
  <table>
    <tr><th>用途地域</th><td>${e(property?.land_use_zone || "")}</td></tr>
    <tr><th>建ぺい率</th><td>${property?.building_coverage_ratio ? `${e(property.building_coverage_ratio)}%` : ""}</td></tr>
    <tr><th>容積率</th><td>${property?.floor_area_ratio ? `${e(property.floor_area_ratio)}%` : ""}</td></tr>
    <tr><th>地目</th><td>${e(property?.zoning || "")}</td></tr>
  </table>

  <h3>4. 飲用水・電気・ガスの供給施設及び排水施設の整備状況</h3>
  <table>
    <tr><th>水道</th><td>${e(property?.water_supply || "（未設定）")}</td></tr>
    <tr><th>ガス</th><td>${e(property?.gas_type || "（未設定）")}</td></tr>
    <tr><th>電気</th><td>${e(property?.electricity || "（未設定）")}</td></tr>
    <tr><th>排水</th><td>${e(property?.sewage || "（未設定）")}</td></tr>
    <tr><th>浄化槽</th><td>${bool(property?.septic_tank)}</td></tr>
  </table>

  <h3>5. 石綿使用調査・耐震診断</h3>
  <table>
    <tr><th>石綿（アスベスト）</th><td>${e(property?.asbestos_survey || "未設定")}</td></tr>
    <tr><th>耐震診断</th><td>${e(property?.earthquake_resistance || "未設定")}</td></tr>
  </table>

  <h3>6. 水害ハザードマップにおける所在地</h3>
  <table>
    <tr>
      <th>洪水</th>
      <td class="${property?.flood_hazard_zone ? "hazard-yes" : "hazard-no"}">${bool(property?.flood_hazard_zone, "浸水想定区域内", "区域外")}</td>
    </tr>
    <tr>
      <th>土砂災害</th>
      <td class="${property?.landslide_hazard_zone ? "hazard-yes" : "hazard-no"}">${bool(property?.landslide_hazard_zone, "警戒区域内", "区域外")}</td>
    </tr>
    <tr>
      <th>津波</th>
      <td class="${property?.tsunami_hazard_zone ? "hazard-yes" : "hazard-no"}">${bool(property?.tsunami_hazard_zone, "浸水想定区域内", "区域外")}</td>
    </tr>
  </table>
  <p class="note">※ 市区町村が作成するハザードマップについて説明を行いました。最新情報は各自治体のウェブサイト等でご確認ください。</p>

  <h2>Ⅱ. 取引条件に関する事項</h2>

  <h3>7. 賃料等の額並びにその支払時期・方法</h3>
  <table>
    <tr><th>賃料（月額）</th><td>${yen(contract.rent)}</td></tr>
    <tr><th>共益費・管理費</th><td>${yen(contract.management_fee)}</td></tr>
    <tr><th>支払方法</th><td>${e(contract.payment_method ? (paymentMethodLabel[contract.payment_method] || "") : "")}</td></tr>
    <tr><th>支払期日</th><td>${contract.payment_due_day ? `毎月${e(contract.payment_due_day)}日` : ""}</td></tr>
  </table>

  <h3>8. 敷金等の精算に関する事項</h3>
  <table>
    <tr><th>敷金</th><td>${fee(contract.deposit, contract.deposit_unit, contract.rent)}</td></tr>
    <tr><th>礼金</th><td>${fee(contract.key_money, contract.key_money_unit, contract.rent)}</td></tr>
    <tr><th>更新料</th><td>${Number(contract.renewal_fee) > 0 ? fee(contract.renewal_fee, contract.renewal_fee_unit, contract.rent) : "なし"}</td></tr>
  </table>
  <p class="note">※ 敷金は、賃料の未払い及び原状回復費用を差し引いた残額が退去後に返還されます。原状回復は、国土交通省「原状回復をめぐるトラブルとガイドライン」に準拠します。</p>

  <h3>9. 契約の種類・期間</h3>
  <table>
    <tr><th>契約種別</th><td>${e(contractTypeLabel[contract.contract_type] || "")}</td></tr>
    <tr><th>契約期間</th><td>${dateStr(contract.start_date)} ～ ${contract.end_date ? dateStr(contract.end_date) : "期限の定めなし"}</td></tr>
  </table>
  ${contract.contract_type === "fixed" ? `
  <p class="note">※ 本契約は定期建物賃貸借契約であり、期間満了により終了します。更新はありません。再契約を希望する場合は、改めて契約を締結する必要があります。</p>` : `
  <p class="note">※ 本契約は普通建物賃貸借契約です。正当な事由がない限り、貸主からの更新拒絶はできません。</p>`}

  <h3>10. 用途その他の利用の制限に関する事項</h3>
  <div class="note" style="padding-left: 0;">
    本物件の用途は住居専用とします。事務所・店舗その他の事業用途での使用はできません。<br>
    ペットの飼育、楽器演奏その他の制限事項については、契約書の特約条項をご確認ください。
  </div>

  <h3>11. 管理の委託先</h3>
  <table>
    <tr><th>管理形態</th><td>${e(managementFormLabel[property?.management_form] || "")}</td></tr>
    <tr><th>管理会社名</th><td>${e(company?.name || "")}</td></tr>
    <tr><th>免許番号</th><td>${e(company?.estate_license || "")}</td></tr>
    <tr><th>住所</th><td>${company?.postal_code ? "〒" + e(company.postal_code) + " " : ""}${e(company?.address || "")}</td></tr>
    <tr><th>電話番号</th><td>${e(formatPhone(company?.phone) || "")}</td></tr>
  </table>

  <h3>12. 賃借人</h3>
  <table>
    <tr><th>氏名</th><td>${e(tenant?.name || "")}</td><th>フリガナ</th><td>${e(tenant?.name_kana || "")}</td></tr>
    <tr><th>生年月日</th><td>${tenant?.date_of_birth ? dateStr(tenant.date_of_birth) : ""}</td><th>電話番号</th><td>${e(formatPhone(tenant?.phone) || "")}</td></tr>
    <tr><th>住所（現住所）</th><td colspan="3">${e(tenant?.address || "")}</td></tr>
    <tr><th>勤務先</th><td>${e(tenant?.workplace || "")}</td><th>勤務先電話</th><td>${e(formatPhone(tenant?.workplace_phone) || "")}</td></tr>
  </table>

  <h3>13. 既存の損傷・汚損の告知</h3>
  <div style="border: 1px solid #999; padding: 8px; margin: 6px 0; min-height: 60px; font-size: 12px;">
    ${e(unit?.damage_notes || "特記事項なし")}
  </div>
  <p class="note">※ 上記以外の損傷・汚損については、入居時チェックリストに記録します。</p>

  ${contract.special_terms ? `
  <h3>14. 特約事項</h3>
  <div style="border: 1px solid #999; padding: 8px; margin: 6px 0; white-space: pre-wrap; font-size: 12px;">${e(contract.special_terms)}</div>` : ""}

  <div class="sig-block">
    <h2>説明の確認</h2>
    <p style="margin: 8px 0;">
      上記の重要事項について、宅地建物取引士より説明を受け、内容を理解しました。
    </p>
    <p style="text-align: right; margin: 12px 0;">
      ${contract.important_explanation_date ? dateStr(contract.important_explanation_date) : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;年&nbsp;&nbsp;&nbsp;&nbsp;月&nbsp;&nbsp;&nbsp;&nbsp;日"}
    </p>

    <div class="sig-row">
      <div class="sig-col">
        <div class="sig-label">説明した宅地建物取引士</div>
        <p>所属：${e(company?.name || "")}</p>
        <p>取引士証登録番号：${e(company?.estate_agent_license || "")}</p>
        <p>氏名：${e(company?.estate_agent_name || "")}<span class="seal-area">印</span></p>
      </div>
      <div class="sig-col">
        <div class="sig-label">説明を受けた者（賃借人）</div>
        <p>住所：${e(tenant?.address || "")}</p>
        <p>氏名：${e(tenant?.name || "")}<span class="seal-area">印</span></p>
        <p>電話：${e(formatPhone(tenant?.phone) || "")}</p>
      </div>
    </div>
  </div>

  <p class="footer-note">
    本書は${e(company?.name || "")}が管理するシステムより出力されました
  </p>

  <div class="no-print" style="text-align:center; margin: 32px 0 8px;">
    <button onclick="window.print()" style="padding: 10px 32px; font-size: 14px; cursor: pointer; background: #1a365d; color: #fff; border: none; border-radius: 6px;">印刷 / PDF保存</button>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
