// デモ会社の固定シードデータ。
// reset-demo cron で「デモを綺麗な初期状態に戻す」ために使う。
// 型は TablesInsert<> に紐付くので、スキーマ変更時に必須カラム追加があれば
// TypeScript ビルドが壊れて気づける。

import type { TablesInsert } from "@/lib/database.types";

type OwnerInsert = TablesInsert<"owners">;
type PropertyInsert = TablesInsert<"properties">;
type UnitInsert = TablesInsert<"units">;
type TenantInsert = TablesInsert<"tenants">;
type ContractInsert = TablesInsert<"contracts">;
type CaseInsert = TablesInsert<"cases">;
type ExpenseInsert = TablesInsert<"expenses">;

// company_id は実行時に渡すため、Omit して seed では持たない
type Seed<T> = Omit<T, "company_id">;

// オーナー 3名（取引銀行・支店を地域に整合）
export const SEED_OWNERS: Seed<OwnerInsert>[] = [
  { id: "b0000000-0000-0000-0000-000000000001", name: "田中 太郎", phone: "09012345678", email: "tanaka@example.com", bank_name: "三菱UFJ銀行", bank_branch: "中野支店",   bank_account_type: "ordinary", bank_account_number: "1234567", bank_account_holder: "タナカ タロウ",   bank_code: "0005", bank_branch_code: "341" },
  { id: "b0000000-0000-0000-0000-000000000002", name: "鈴木 花子", phone: "09023456789", email: "suzuki@example.com", bank_name: "三井住友銀行", bank_branch: "梅田支店",   bank_account_type: "ordinary", bank_account_number: "2345678", bank_account_holder: "スズキ ハナコ",   bank_code: "0009", bank_branch_code: "259" },
  { id: "b0000000-0000-0000-0000-000000000003", name: "佐藤 一郎", phone: "09034567890", email: "sato@example.com",   bank_name: "みずほ銀行",   bank_branch: "名古屋支店", bank_account_type: "ordinary", bank_account_number: "3456789", bank_account_holder: "サトウ イチロウ", bank_code: "0001", bank_branch_code: "001" },
];

// 物件 4棟（4都市に分散）
export const SEED_PROPERTIES: Seed<PropertyInsert>[] = [
  { id: "c0000000-0000-0000-0000-000000000001", owner_id: "b0000000-0000-0000-0000-000000000001", name: "グランメゾン中野",   property_type: "apartment", address: "東京都中野区中央2-3-4",          structure: "RC",  floors: 10, built_year: 2015, total_units: 30, nearest_station: "中野駅", walk_minutes: 5, management_fee_rate: 5.0 },
  { id: "c0000000-0000-0000-0000-000000000002", owner_id: "b0000000-0000-0000-0000-000000000002", name: "リバーサイド梅田",   property_type: "apartment", address: "大阪府大阪市北区梅田3-1-3",      structure: "SRC", floors: 8,  built_year: 2018, total_units: 24, nearest_station: "梅田駅", walk_minutes: 8, management_fee_rate: 5.0 },
  { id: "c0000000-0000-0000-0000-000000000003", owner_id: "b0000000-0000-0000-0000-000000000003", name: "サンライズ栄",       property_type: "apartment", address: "愛知県名古屋市中区栄3-5-12",     structure: "RC",  floors: 5,  built_year: 2010, total_units: 15, nearest_station: "栄駅",   walk_minutes: 3, management_fee_rate: 5.0 },
  { id: "c0000000-0000-0000-0000-000000000004", owner_id: "b0000000-0000-0000-0000-000000000003", name: "パークハイツ博多",   property_type: "apartment", address: "福岡県福岡市博多区博多駅前2-1-1", structure: "SRC", floors: 12, built_year: 2020, total_units: 40, nearest_station: "博多駅", walk_minutes: 6, management_fee_rate: 4.5 },
];

// 区画 13戸
export const SEED_UNITS: Seed<UnitInsert>[] = [
  { id: "d0000000-0000-0000-0000-000000000001", property_id: "c0000000-0000-0000-0000-000000000001", unit_number: "101", floor: 1, layout: "1K",   area_sqm: 25.0, rent:  85000, management_fee:  5000, status: "occupied" },
  { id: "d0000000-0000-0000-0000-000000000002", property_id: "c0000000-0000-0000-0000-000000000001", unit_number: "102", floor: 1, layout: "1K",   area_sqm: 25.0, rent:  85000, management_fee:  5000, status: "occupied" },
  { id: "d0000000-0000-0000-0000-000000000003", property_id: "c0000000-0000-0000-0000-000000000001", unit_number: "201", floor: 2, layout: "1LDK", area_sqm: 40.0, rent: 120000, management_fee:  8000, status: "occupied" },
  { id: "d0000000-0000-0000-0000-000000000004", property_id: "c0000000-0000-0000-0000-000000000001", unit_number: "202", floor: 2, layout: "1LDK", area_sqm: 40.0, rent: 120000, management_fee:  8000, status: "vacant" },
  { id: "d0000000-0000-0000-0000-000000000005", property_id: "c0000000-0000-0000-0000-000000000001", unit_number: "301", floor: 3, layout: "2LDK", area_sqm: 55.0, rent: 160000, management_fee: 10000, status: "occupied" },
  { id: "d0000000-0000-0000-0000-000000000006", property_id: "c0000000-0000-0000-0000-000000000002", unit_number: "101", floor: 1, layout: "1K",   area_sqm: 22.0, rent:  72000, management_fee:  4000, status: "occupied" },
  { id: "d0000000-0000-0000-0000-000000000007", property_id: "c0000000-0000-0000-0000-000000000002", unit_number: "102", floor: 1, layout: "1K",   area_sqm: 22.0, rent:  72000, management_fee:  4000, status: "vacant" },
  { id: "d0000000-0000-0000-0000-000000000008", property_id: "c0000000-0000-0000-0000-000000000002", unit_number: "201", floor: 2, layout: "1LDK", area_sqm: 38.0, rent: 105000, management_fee:  6000, status: "occupied" },
  { id: "d0000000-0000-0000-0000-000000000009", property_id: "c0000000-0000-0000-0000-000000000003", unit_number: "101", floor: 1, layout: "1K",   area_sqm: 20.0, rent:  65000, management_fee:  3000, status: "occupied" },
  { id: "d0000000-0000-0000-0000-000000000010", property_id: "c0000000-0000-0000-0000-000000000003", unit_number: "201", floor: 2, layout: "2DK",  area_sqm: 42.0, rent:  95000, management_fee:  5000, status: "vacant" },
  { id: "d0000000-0000-0000-0000-000000000011", property_id: "c0000000-0000-0000-0000-000000000004", unit_number: "101", floor: 1, layout: "1K",   area_sqm: 28.0, rent: 110000, management_fee:  8000, status: "occupied" },
  { id: "d0000000-0000-0000-0000-000000000012", property_id: "c0000000-0000-0000-0000-000000000004", unit_number: "501", floor: 5, layout: "2LDK", area_sqm: 60.0, rent: 200000, management_fee: 12000, status: "occupied" },
  { id: "d0000000-0000-0000-0000-000000000013", property_id: "c0000000-0000-0000-0000-000000000004", unit_number: "502", floor: 5, layout: "2LDK", area_sqm: 60.0, rent: 200000, management_fee: 12000, status: "maintenance" },
];

// 入居者 9名
export const SEED_TENANTS: Seed<TenantInsert>[] = [
  { id: "e0000000-0000-0000-0000-000000000001", name: "山田 健太",   name_kana: "ヤマダ ケンタ",     phone: "08011112222", email: "yamada@example.com",    workplace: "株式会社テック" },
  { id: "e0000000-0000-0000-0000-000000000002", name: "高橋 美咲",   name_kana: "タカハシ ミサキ",   phone: "08033334444", email: "takahashi@example.com", workplace: "デザイン事務所" },
  { id: "e0000000-0000-0000-0000-000000000003", name: "伊藤 大輔",   name_kana: "イトウ ダイスケ",   phone: "08055556666", email: "ito@example.com",       workplace: "商社株式会社" },
  { id: "e0000000-0000-0000-0000-000000000004", name: "渡辺 さくら", name_kana: "ワタナベ サクラ",   phone: "08077778888", email: "watanabe@example.com",  workplace: "看護師" },
  { id: "e0000000-0000-0000-0000-000000000005", name: "中村 翔太",   name_kana: "ナカムラ ショウタ", phone: "08099990000", email: "nakamura@example.com",  workplace: "フリーランス" },
  { id: "e0000000-0000-0000-0000-000000000006", name: "小林 由美",   name_kana: "コバヤシ ユミ",     phone: "08012345678", email: "kobayashi@example.com", workplace: "出版社" },
  { id: "e0000000-0000-0000-0000-000000000007", name: "加藤 誠",     name_kana: "カトウ マコト",     phone: "08023456789", email: "kato@example.com",      workplace: "銀行" },
  { id: "e0000000-0000-0000-0000-000000000008", name: "吉田 あかね", name_kana: "ヨシダ アカネ",     phone: "08034567890", email: "yoshida@example.com",   workplace: "IT企業" },
  { id: "e0000000-0000-0000-0000-000000000009", name: "松本 隆",     name_kana: "マツモト タカシ",   phone: "08045678901", email: "matsumoto@example.com", workplace: "教師" },
  // 502号室を退去した入居者（退去後リフォームの敷金精算用）
  { id: "e0000000-0000-0000-0000-000000000010", name: "斉藤 直樹",   name_kana: "サイトウ ナオキ",   phone: "08056789012", email: "saito@example.com",     workplace: "メーカー" },
];

// 契約 10件（うち1件は502号室の退去済み契約）
export const SEED_CONTRACTS: Seed<ContractInsert>[] = [
  { id: "f0000000-0000-0000-0000-000000000001", unit_id: "d0000000-0000-0000-0000-000000000001", tenant_id: "e0000000-0000-0000-0000-000000000001", contract_type: "ordinary", start_date: "2024-04-01", end_date: "2026-03-31", rent:  85000, management_fee:  5000, deposit: 170000, key_money:  85000, status: "active", move_in_date: "2024-04-01" },
  { id: "f0000000-0000-0000-0000-000000000002", unit_id: "d0000000-0000-0000-0000-000000000002", tenant_id: "e0000000-0000-0000-0000-000000000002", contract_type: "fixed",    start_date: "2025-01-01", end_date: "2026-12-31", rent:  85000, management_fee:  5000, deposit: 170000, key_money:      0, status: "active", move_in_date: "2025-01-01" },
  { id: "f0000000-0000-0000-0000-000000000003", unit_id: "d0000000-0000-0000-0000-000000000003", tenant_id: "e0000000-0000-0000-0000-000000000003", contract_type: "ordinary", start_date: "2023-07-01", end_date: "2025-06-30", rent: 120000, management_fee:  8000, deposit: 240000, key_money: 120000, status: "active", move_in_date: "2023-07-01" },
  { id: "f0000000-0000-0000-0000-000000000004", unit_id: "d0000000-0000-0000-0000-000000000005", tenant_id: "e0000000-0000-0000-0000-000000000004", contract_type: "ordinary", start_date: "2024-10-01", end_date: "2026-09-30", rent: 160000, management_fee: 10000, deposit: 320000, key_money: 160000, status: "active", move_in_date: "2024-10-01" },
  { id: "f0000000-0000-0000-0000-000000000005", unit_id: "d0000000-0000-0000-0000-000000000006", tenant_id: "e0000000-0000-0000-0000-000000000005", contract_type: "fixed",    start_date: "2025-02-01", end_date: "2027-01-31", rent:  72000, management_fee:  4000, deposit: 144000, key_money:      0, status: "active", move_in_date: "2025-02-01" },
  { id: "f0000000-0000-0000-0000-000000000006", unit_id: "d0000000-0000-0000-0000-000000000008", tenant_id: "e0000000-0000-0000-0000-000000000006", contract_type: "ordinary", start_date: "2024-06-01", end_date: "2026-05-31", rent: 105000, management_fee:  6000, deposit: 210000, key_money: 105000, status: "active", move_in_date: "2024-06-01" },
  { id: "f0000000-0000-0000-0000-000000000007", unit_id: "d0000000-0000-0000-0000-000000000009", tenant_id: "e0000000-0000-0000-0000-000000000007", contract_type: "ordinary", start_date: "2023-04-01", end_date: "2025-03-31", rent:  65000, management_fee:  3000, deposit: 130000, key_money:      0, status: "active", move_in_date: "2023-04-01" },
  { id: "f0000000-0000-0000-0000-000000000008", unit_id: "d0000000-0000-0000-0000-000000000011", tenant_id: "e0000000-0000-0000-0000-000000000008", contract_type: "fixed",    start_date: "2025-01-01", end_date: "2026-12-31", rent: 110000, management_fee:  8000, deposit: 220000, key_money: 110000, status: "active", move_in_date: "2025-01-01" },
  { id: "f0000000-0000-0000-0000-000000000009", unit_id: "d0000000-0000-0000-0000-000000000012", tenant_id: "e0000000-0000-0000-0000-000000000009", contract_type: "ordinary", start_date: "2024-08-01", end_date: "2026-07-31", rent: 200000, management_fee: 12000, deposit: 400000, key_money: 200000, status: "active", move_in_date: "2024-08-01" },
  // 502号室（d...013, maintenance中）の退去済み契約。退去後リフォーム費の敷金精算に紐づける。
  // 敷金は家賃2ヶ月分（¥400,000）。move_out_date は壁紙張替え経費より前。
  { id: "f0000000-0000-0000-0000-000000000010", unit_id: "d0000000-0000-0000-0000-000000000013", tenant_id: "e0000000-0000-0000-0000-000000000010", contract_type: "ordinary", start_date: "2023-09-01", end_date: "2026-05-31", rent: 200000, management_fee: 12000, deposit: 400000, key_money: 0, status: "terminated", move_in_date: "2023-09-01", move_out_date: "2026-05-15" },
];

// 対応案件 5件（旧 maintenance_requests + inquiries を統合）
// reported_date は v_today からの差分（日数）として持つ。SQL生成時に CURRENT_DATE - N に変換。
type CaseSeed = Omit<Seed<CaseInsert>, "reported_date" | "completed_date" | "created_at" | "updated_at"> & {
  reportedDaysAgo: number;
  completedDaysAgo?: number;
  createdDaysAgo?: number;
};

export const SEED_CASES: CaseSeed[] = [
  { id: "20000000-0000-0000-0000-000000000001", property_id: "c0000000-0000-0000-0000-000000000001", unit_id: "d0000000-0000-0000-0000-000000000003", tenant_id: "e0000000-0000-0000-0000-000000000003", title: "エアコン故障",       description: "冷房が効かない。室外機から異音がする。", category: "repair",   priority: "high",   status: "in_progress", vendor_name: "エアコン修理センター", estimated_cost: 35000, source: "admin", reportedDaysAgo: 30 },
  { id: "20000000-0000-0000-0000-000000000002", property_id: "c0000000-0000-0000-0000-000000000002", unit_id: "d0000000-0000-0000-0000-000000000006", tenant_id: "e0000000-0000-0000-0000-000000000005", title: "水漏れ",             description: "キッチン下から水漏れ。",                 category: "repair",   priority: "urgent", status: "open",        source: "admin", reportedDaysAgo: 5 },
  { id: "20000000-0000-0000-0000-000000000003", property_id: "c0000000-0000-0000-0000-000000000004", unit_id: "d0000000-0000-0000-0000-000000000013",                                                       title: "退去後リフォーム",   description: "壁紙張替え、クリーニング",                category: "repair",   priority: "normal", status: "open",        estimated_cost: 180000, source: "admin", reportedDaysAgo: 10 },
  { id: "20000000-0000-0000-0000-000000000004", property_id: "c0000000-0000-0000-0000-000000000003", unit_id: "d0000000-0000-0000-0000-000000000009", tenant_id: "e0000000-0000-0000-0000-000000000007", title: "給湯器の調子が悪い", description: "お湯の温度が安定しない",                 category: "repair",   priority: "normal", status: "completed",   vendor_name: "設備メンテナンス",     estimated_cost: 15000, actual_cost: 12000, source: "admin", reportedDaysAgo: 40, completedDaysAgo: 30 },
  { id: "30000000-0000-0000-0000-000000000001", property_id: "c0000000-0000-0000-0000-000000000001",                                                  tenant_id: "e0000000-0000-0000-0000-000000000001", title: "上階の騒音",         description: "夜間の足音が気になる",                   category: "neighbor", priority: "normal", status: "in_progress", source: "tenant", reportedDaysAgo: 3, createdDaysAgo: 3 },
];

// 経費 6件 (新スキーマ: owner_amount / tenant_amount / company_amount に振り分け)
// 旧 is_owner_charge=true → owner_amount = amount
// 旧 is_owner_charge=false → company_amount = amount
type ExpenseSeed = Omit<Seed<ExpenseInsert>, "expense_date"> & { expenseDaysAgo: number };

export const SEED_EXPENSES: ExpenseSeed[] = [
  { id: "40000000-0000-0000-0000-000000000001", property_id: "c0000000-0000-0000-0000-000000000001",                                                  owner_id: "b0000000-0000-0000-0000-000000000001", category: "repair",    description: "共用部廊下LED照明交換",       amount:  45000, owner_amount:  45000, tenant_amount: 0, company_amount: 0,      status: "approved", tax_category: "taxable", expenseDaysAgo: 15 },
  { id: "40000000-0000-0000-0000-000000000002", property_id: "c0000000-0000-0000-0000-000000000002", unit_id: "d0000000-0000-0000-0000-000000000007", owner_id: "b0000000-0000-0000-0000-000000000002", category: "cleaning",  description: "102号室 退去後クリーニング", amount:  35000, owner_amount:  35000, tenant_amount: 0, company_amount: 0,      status: "approved", tax_category: "taxable", expenseDaysAgo: 20 },
  { id: "40000000-0000-0000-0000-000000000003", property_id: "c0000000-0000-0000-0000-000000000003",                                                  owner_id: "b0000000-0000-0000-0000-000000000003", category: "insurance", description: "火災保険（年額）",           amount: 120000, owner_amount: 120000, tenant_amount: 0, company_amount: 0,      status: "approved", tax_category: "taxable", expenseDaysAgo: 100 },
  { id: "40000000-0000-0000-0000-000000000004", property_id: "c0000000-0000-0000-0000-000000000004", unit_id: "d0000000-0000-0000-0000-000000000013", owner_id: "b0000000-0000-0000-0000-000000000003", category: "repair",    description: "502号室 壁紙張替え",          amount:  85000, owner_amount:  85000, tenant_amount: 0, company_amount: 0,      status: "approved", tax_category: "taxable", expenseDaysAgo: 5 },
  { id: "40000000-0000-0000-0000-000000000005", property_id: "c0000000-0000-0000-0000-000000000001",                                                                                                    category: "utility",   description: "共用部電気代",                amount:  18500, owner_amount:      0, tenant_amount: 0, company_amount: 18500,  status: "approved", tax_category: "taxable", expenseDaysAgo: 2 },
  { id: "40000000-0000-0000-0000-000000000006", property_id: "c0000000-0000-0000-0000-000000000004",                                                  owner_id: "b0000000-0000-0000-0000-000000000003", category: "tax",       description: "固定資産税",                  amount: 250000, owner_amount: 250000, tenant_amount: 0, company_amount: 0,      status: "approved", tax_category: "non_taxable", expenseDaysAgo: 25 },
];

// 家賃データ生成の振込元銀行ローテーション
export const PAYMENT_BANKS: Array<[string, string]> = [
  ["三菱UFJ銀行", "中野支店"],
  ["三井住友銀行", "梅田支店"],
  ["みずほ銀行", "名古屋支店"],
  ["りそな銀行", "博多支店"],
  ["ゆうちょ銀行", "〇一八店"],
  ["住信SBIネット銀行", "イチゴ支店"],
  ["楽天銀行", "ジャズ支店"],
  ["PayPay銀行", "ビジネス営業部"],
  ["GMOあおぞらネット銀行", "法人営業部"],
];

// 入居者名義（カナ）。契約金額昇順
export const PAYMENT_HOLDERS = [
  "カトウマコト",
  "ナカムラショウタ",
  "ヤマダケンタ",
  "タカハシミサキ",
  "コバヤシユミ",
  "ヨシダアカネ",
  "イトウダイスケ",
  "ワタナベサクラ",
  "マツモトタカシ",
];

// 家賃 6ヶ月分の動的生成用パラメータ
// 契約IDを金額昇順で並べたもの（小額の契約から未収になる自然さ）
export const BILLING_CONTRACTS_ASC = [
  { id: "f0000000-0000-0000-0000-000000000007", rent:  65000, mgmt:  3000 },
  { id: "f0000000-0000-0000-0000-000000000005", rent:  72000, mgmt:  4000 },
  { id: "f0000000-0000-0000-0000-000000000001", rent:  85000, mgmt:  5000 },
  { id: "f0000000-0000-0000-0000-000000000002", rent:  85000, mgmt:  5000 },
  { id: "f0000000-0000-0000-0000-000000000006", rent: 105000, mgmt:  6000 },
  { id: "f0000000-0000-0000-0000-000000000008", rent: 110000, mgmt:  8000 },
  { id: "f0000000-0000-0000-0000-000000000003", rent: 120000, mgmt:  8000 },
  { id: "f0000000-0000-0000-0000-000000000004", rent: 160000, mgmt: 10000 },
  { id: "f0000000-0000-0000-0000-000000000009", rent: 200000, mgmt: 12000 },
];

// 月ごとの (未収件数合計, うち overdue 件数)
// インデックス: 0=5ヶ月前 ... 5=当月
export const MISS_TOTAL = [0, 1, 1, 1, 0, 2];
export const MISS_OVERDUE = [0, 0, 1, 0, 0, 1];
