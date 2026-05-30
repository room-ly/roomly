// 監査ログの差分表示で使う、カラムごとの「ラベル」と「型」の定義。
// 型はフォーマット判定にも使う:
//   money     → ¥95,000 のような金額表記
//   percent   → 5% のようなパーセント表記
//   date      → 2026-05-30 のような日付表記
//   datetime  → 2026-05-30 14:23 のような日時表記
//   month     → 2026-05 のような月表記
//   bool      → あり/なし
//   text      → そのまま（デフォルト）

export type FieldType =
  | "text"
  | "money"
  | "percent"
  | "date"
  | "datetime"
  | "month"
  | "bool";

interface FieldDef {
  label: string;
  type?: FieldType;
}

function f(label: string, type?: FieldType): FieldDef {
  return { label, type };
}

const COMMON: Record<string, FieldDef> = {
  name: f("名前"),
  name_kana: f("フリガナ"),
  email: f("メールアドレス"),
  phone: f("電話番号"),
  fax: f("FAX"),
  postal_code: f("郵便番号"),
  address: f("住所"),
  notes: f("メモ"),
  internal_memo: f("社内メモ"),
  status: f("ステータス"),
  is_active: f("有効", "bool"),
  created_at: f("作成日時", "datetime"),
  updated_at: f("更新日時", "datetime"),
  deleted_at: f("削除日時", "datetime"),
  company_id: f("会社ID"),
};

const TABLE_FIELDS: Record<string, Record<string, FieldDef>> = {
  properties: {
    property_code: f("物件コード"),
    property_type: f("物件種別"),
    structure: f("構造"),
    floors: f("階数"),
    underground_floors: f("地下階数"),
    total_units: f("総戸数"),
    total_area_sqm: f("延床面積"),
    building_area_sqm: f("建築面積"),
    land_area_sqm: f("土地面積"),
    built_year: f("築年"),
    built_month: f("築月"),
    renovation_year: f("改装年"),
    renovation_month: f("改装月"),
    nearest_station: f("最寄り駅"),
    walk_minutes: f("徒歩(分)"),
    management_form: f("管理形態"),
    management_company: f("管理会社"),
    management_fee_type: f("管理手数料種別"),
    management_fee_rate: f("管理手数料率", "percent"),
    management_fee_amount: f("管理手数料額", "money"),
    parking: f("駐車場"),
    parking_fee: f("駐車場料金", "money"),
    owner_id: f("オーナーID"),
    approver_user_id: f("承認者"),
    appeal_points: f("アピールポイント"),
    estate_license: f("宅建業免許"),
    prefecture: f("都道府県"),
    city: f("市区町村"),
    town: f("町名"),
    building_number: f("番地"),
    latitude: f("緯度"),
    longitude: f("経度"),
    nearest_station_2: f("最寄り駅2"),
    walk_minutes_2: f("徒歩2(分)"),
    nearest_station_3: f("最寄り駅3"),
    walk_minutes_3: f("徒歩3(分)"),
    nearest_station_id: f("最寄り駅ID"),
    nearest_station_2_id: f("最寄り駅2 ID"),
    nearest_station_3_id: f("最寄り駅3 ID"),
    bus_station: f("最寄りバス停"),
    bus_minutes: f("バス停徒歩(分)"),
    bicycle_parking: f("駐輪場"),
    bike_parking: f("バイク置場"),
    common_facilities: f("共用設備"),
    land_use_zone: f("用途地域"),
    land_rights: f("土地権利"),
    building_coverage_ratio: f("建ぺい率", "percent"),
    floor_area_ratio: f("容積率", "percent"),
    zoning: f("用途区分"),
    transaction_type: f("取引態様"),
    internal_memo: f("社内メモ"),
    registered_owner_name: f("登記上の所有者"),
    mortgage_exists: f("抵当権", "bool"),
    mortgagee: f("抵当権者"),
    mortgage_amount: f("抵当権設定額", "money"),
    water_supply: f("給水"),
    gas_type: f("ガス種別"),
    electricity: f("電気"),
    sewage: f("排水"),
    septic_tank: f("浄化槽", "bool"),
    asbestos_survey: f("アスベスト調査"),
    earthquake_resistance: f("耐震性"),
    flood_hazard_zone: f("洪水ハザード", "bool"),
    landslide_hazard_zone: f("土砂災害ハザード", "bool"),
    tsunami_hazard_zone: f("津波ハザード", "bool"),
    default_allocation_method: f("既定按分方法"),
  },
  units: {
    unit_number: f("部屋番号"),
    floor: f("階"),
    layout: f("間取り"),
    area_sqm: f("面積"),
    rent: f("賃料", "money"),
    management_fee: f("管理費", "money"),
    deposit: f("敷金", "money"),
    deposit_unit: f("敷金 単位"),
    key_money: f("礼金", "money"),
    key_money_unit: f("礼金 単位"),
    property_id: f("物件ID"),
    damage_notes: f("損耗メモ"),
    equipment: f("設備"),
  },
  tenants: {
    date_of_birth: f("生年月日", "date"),
    gender: f("性別"),
    nationality: f("国籍"),
    workplace: f("勤務先"),
    workplace_phone: f("勤務先電話"),
    annual_income: f("年収(万円)"),
    emergency_contact_name: f("緊急連絡先 氏名"),
    emergency_contact_phone: f("緊急連絡先 電話"),
    emergency_contact_relation: f("緊急連絡先 続柄"),
    guarantee_type: f("保証区分"),
    guarantee_company_name: f("保証会社名"),
    guarantee_contract_number: f("保証契約番号"),
    guarantee_fee: f("保証料", "money"),
    guarantor_name: f("連帯保証人 氏名"),
    guarantor_phone: f("連帯保証人 電話"),
    guarantor_address: f("連帯保証人 住所"),
    guarantor_postal_code: f("連帯保証人 郵便番号"),
    guarantor_annual_income: f("連帯保証人 年収(万円)"),
    guarantor_relation: f("連帯保証人 続柄"),
    guarantor_name_kana: f("連帯保証人 フリガナ"),
    guarantor_date_of_birth: f("連帯保証人 生年月日", "date"),
    guarantor_workplace: f("連帯保証人 勤務先"),
    guarantor_workplace_phone: f("連帯保証人 勤務先電話"),
  },
  contracts: {
    unit_id: f("部屋ID"),
    tenant_id: f("入居者ID"),
    contract_type: f("契約種別"),
    start_date: f("契約開始日", "date"),
    end_date: f("契約終了日", "date"),
    rent: f("賃料", "money"),
    management_fee: f("管理費", "money"),
    move_in_date: f("入居日", "date"),
    move_out_date: f("退去日", "date"),
    deposit: f("敷金", "money"),
    deposit_unit: f("敷金 単位"),
    key_money: f("礼金", "money"),
    key_money_unit: f("礼金 単位"),
    renewal_fee: f("更新料", "money"),
    renewal_fee_unit: f("更新料 単位"),
    brokerage_fee: f("仲介手数料", "money"),
    signed_date: f("契約締結日", "date"),
    important_explanation_date: f("重要事項説明日", "date"),
    payment_method: f("支払方法"),
    payment_due_day: f("支払期日"),
    guarantor_name: f("連帯保証人 氏名"),
    guarantor_phone: f("連帯保証人 電話"),
    insurance_company: f("火災保険会社"),
    special_terms: f("特約事項"),
    expiry_notified_at: f("満了通知日", "date"),
  },
  rent_billings: {
    contract_id: f("契約ID"),
    billing_month: f("請求月", "month"),
    rent: f("賃料", "money"),
    management_fee: f("管理費", "money"),
    other_amount: f("その他金額", "money"),
    other_description: f("その他内容"),
    total_amount: f("合計金額", "money"),
    due_date: f("支払期限", "date"),
    overdue_notified_at: f("延滞通知日", "date"),
  },
  rent_payments: {
    billing_id: f("請求ID"),
    amount: f("金額", "money"),
    payment_method: f("支払方法"),
    payment_date: f("入金日", "date"),
  },
  cases: {
    title: f("件名"),
    description: f("詳細"),
    category: f("カテゴリ"),
    priority: f("優先度"),
    property_id: f("物件ID"),
    unit_id: f("部屋ID"),
    tenant_id: f("入居者ID"),
    reported_date: f("受付日", "date"),
    completed_date: f("完了日", "date"),
    vendor_name: f("業者名"),
    vendor_phone: f("業者電話"),
    scheduled_date: f("予定日", "date"),
    estimated_cost: f("見積金額", "money"),
    actual_cost: f("実費", "money"),
    source: f("発生元"),
    payee_id: f("支払先ID"),
  },
  expenses: {
    expense_date: f("経費発生日", "date"),
    amount: f("金額", "money"),
    owner_amount: f("オーナー負担額", "money"),
    tenant_amount: f("入居者負担額", "money"),
    company_amount: f("自社負担額", "money"),
    category: f("カテゴリ"),
    description: f("内容"),
    payee_id: f("支払先ID"),
    property_id: f("物件ID"),
    unit_id: f("部屋ID"),
    owner_id: f("オーナーID"),
    case_id: f("対応案件ID"),
    contract_id: f("契約ID"),
    vendor_name: f("業者名"),
    invoice_number: f("請求書番号"),
    tax_category: f("税区分"),
    payment_due_date: f("支払期日", "date"),
    paid_at: f("支払日", "date"),
    submitted_by: f("申請者"),
    submitted_at: f("申請日時", "datetime"),
    approved_by: f("承認者"),
    approved_at: f("承認日時", "datetime"),
    rejected_reason: f("却下理由"),
  },
  owners: {
    bank_name: f("銀行名"),
    bank_code: f("銀行コード"),
    bank_branch: f("支店名"),
    bank_branch_code: f("支店コード"),
    bank_account_type: f("口座種別"),
    bank_account_number: f("口座番号"),
    bank_account_holder: f("口座名義"),
    bank_account_holder_kana: f("口座名義カナ"),
    mobile_phone: f("携帯電話"),
    birth_date: f("生年月日", "date"),
    owner_type: f("オーナー区分"),
    company_name: f("法人名"),
    company_name_kana: f("法人名カナ"),
    representative_name: f("代表者名"),
    invoice_number: f("インボイス番号"),
    withholding_required: f("源泉徴収要否", "bool"),
    mailing_address: f("送付先住所"),
    mailing_postal_code: f("送付先郵便番号"),
    emergency_contact_name: f("緊急連絡先 氏名"),
    emergency_contact_phone: f("緊急連絡先 電話"),
    emergency_contact_relation: f("緊急連絡先 続柄"),
  },
  owner_remittances: {
    owner_id: f("オーナーID"),
    remittance_month: f("送金対象月", "month"),
    total_rent: f("家賃収入", "money"),
    management_fee_deducted: f("管理手数料控除", "money"),
    expense_deducted: f("経費控除", "money"),
    net_amount: f("送金額", "money"),
    payment_method: f("支払方法"),
    sent_date: f("送金日", "date"),
    manual_override: f("手動上書き", "bool"),
    manual_net_amount: f("手動送金額", "money"),
    transfer_date: f("振込日", "date"),
  },
  payees: {
    category: f("カテゴリ"),
    bank_name: f("銀行名"),
    bank_code: f("銀行コード"),
    branch_name: f("支店名"),
    branch_code: f("支店コード"),
    account_type: f("口座種別"),
    account_number: f("口座番号"),
    account_holder_kana: f("口座名義カナ"),
  },
};

function getDef(table: string, column: string): FieldDef | undefined {
  return TABLE_FIELDS[table]?.[column] ?? COMMON[column];
}

export function fieldLabel(table: string, column: string): string {
  return getDef(table, column)?.label ?? column;
}

export function fieldType(table: string, column: string): FieldType {
  return getDef(table, column)?.type ?? "text";
}

// 値を型に応じて整形する。未対応の型はそのまま文字列化。
export function formatFieldValue(
  value: unknown,
  type: FieldType
): string {
  if (value === null || value === undefined || value === "") return "—";

  switch (type) {
    case "money": {
      const n = Number(value);
      if (Number.isNaN(n)) return String(value);
      return `¥${n.toLocaleString()}`;
    }
    case "percent": {
      const n = Number(value);
      if (Number.isNaN(n)) return String(value);
      return `${n}%`;
    }
    case "date": {
      // 'YYYY-MM-DD' or ISO timestamp → 'YYYY-MM-DD'
      const s = String(value);
      const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : s;
    }
    case "datetime": {
      const d = new Date(String(value));
      if (Number.isNaN(d.getTime())) return String(value);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const h = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      return `${y}-${mo}-${day} ${h}:${mi}`;
    }
    case "month": {
      // 'YYYY-MM-01' / 'YYYY-MM' → 'YYYY-MM'
      const s = String(value);
      const m = s.match(/^(\d{4}-\d{2})/);
      return m ? m[1] : s;
    }
    case "bool": {
      if (typeof value === "boolean") return value ? "あり" : "なし";
      if (value === "true") return "あり";
      if (value === "false") return "なし";
      return String(value);
    }
    case "text":
    default: {
      if (typeof value === "boolean") return value ? "あり" : "なし";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    }
  }
}

// 差分表示で無視するカラム（毎回変わるか、機械的で見せても意味がないもの）
const IGNORE = new Set([
  "id", "company_id", "created_at", "updated_at",
]);

export function isIgnoredField(column: string): boolean {
  return IGNORE.has(column);
}
