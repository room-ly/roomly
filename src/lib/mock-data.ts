import type {
  Owner,
  Property,
  Unit,
  Tenant,
  Contract,
  RentBilling,
  MaintenanceRequest,
  Inquiry,
  DashboardStats,
} from "@/types";

// オーナー
export const owners: Owner[] = [
  {
    id: "owner-1",
    company_id: "co-1",
    name: "田中 太郎",
    phone: "090-1234-5678",
    email: "tanaka@example.com",
    management_fee_rate: 5.0,
  },
  {
    id: "owner-2",
    company_id: "co-1",
    name: "鈴木 花子",
    phone: "090-2345-6789",
    email: "suzuki@example.com",
    management_fee_rate: 5.0,
  },
  {
    id: "owner-3",
    company_id: "co-1",
    name: "佐藤 一郎",
    phone: "090-3456-7890",
    email: "sato@example.com",
    management_fee_rate: 4.5,
  },
];

// 物件
export const properties: Property[] = [
  {
    id: "prop-1",
    company_id: "co-1",
    owner_id: "owner-1",
    name: "グランメゾン新宿",
    property_type: "apartment",
    address: "東京都新宿区西新宿1-1-1",
    structure: "RC",
    floors: 10,
    built_year: 2015,
    total_units: 30,
    nearest_station: "新宿駅",
    walk_minutes: 5,
    owner: owners[0],
  },
  {
    id: "prop-2",
    company_id: "co-1",
    owner_id: "owner-1",
    name: "リバーサイド中野",
    property_type: "apartment",
    address: "東京都中野区中央2-3-4",
    structure: "SRC",
    floors: 8,
    built_year: 2018,
    total_units: 24,
    nearest_station: "中野駅",
    walk_minutes: 8,
    owner: owners[0],
  },
  {
    id: "prop-3",
    company_id: "co-1",
    owner_id: "owner-2",
    name: "サンライズ杉並",
    property_type: "apartment",
    address: "東京都杉並区高円寺北3-5-6",
    structure: "RC",
    floors: 5,
    built_year: 2010,
    total_units: 15,
    nearest_station: "高円寺駅",
    walk_minutes: 3,
    owner: owners[1],
  },
  {
    id: "prop-4",
    company_id: "co-1",
    owner_id: "owner-3",
    name: "パークハイツ渋谷",
    property_type: "apartment",
    address: "東京都渋谷区道玄坂1-2-3",
    structure: "SRC",
    floors: 12,
    built_year: 2020,
    total_units: 40,
    nearest_station: "渋谷駅",
    walk_minutes: 6,
    owner: owners[2],
  },
];

// 部屋
export const units: Unit[] = [
  // グランメゾン新宿
  { id: "unit-1", company_id: "co-1", property_id: "prop-1", unit_number: "101", floor: 1, layout: "1K", area_sqm: 25, rent: 85000, management_fee: 5000, status: "occupied" },
  { id: "unit-2", company_id: "co-1", property_id: "prop-1", unit_number: "102", floor: 1, layout: "1K", area_sqm: 25, rent: 85000, management_fee: 5000, status: "occupied" },
  { id: "unit-3", company_id: "co-1", property_id: "prop-1", unit_number: "201", floor: 2, layout: "1LDK", area_sqm: 40, rent: 120000, management_fee: 8000, status: "occupied" },
  { id: "unit-4", company_id: "co-1", property_id: "prop-1", unit_number: "202", floor: 2, layout: "1LDK", area_sqm: 40, rent: 120000, management_fee: 8000, status: "vacant" },
  { id: "unit-5", company_id: "co-1", property_id: "prop-1", unit_number: "301", floor: 3, layout: "2LDK", area_sqm: 55, rent: 160000, management_fee: 10000, status: "occupied" },
  // リバーサイド中野
  { id: "unit-6", company_id: "co-1", property_id: "prop-2", unit_number: "101", floor: 1, layout: "1K", area_sqm: 22, rent: 72000, management_fee: 4000, status: "occupied" },
  { id: "unit-7", company_id: "co-1", property_id: "prop-2", unit_number: "102", floor: 1, layout: "1K", area_sqm: 22, rent: 72000, management_fee: 4000, status: "vacant" },
  { id: "unit-8", company_id: "co-1", property_id: "prop-2", unit_number: "201", floor: 2, layout: "1LDK", area_sqm: 38, rent: 105000, management_fee: 6000, status: "occupied" },
  // サンライズ杉並
  { id: "unit-9", company_id: "co-1", property_id: "prop-3", unit_number: "101", floor: 1, layout: "1K", area_sqm: 20, rent: 65000, management_fee: 3000, status: "occupied" },
  { id: "unit-10", company_id: "co-1", property_id: "prop-3", unit_number: "201", floor: 2, layout: "2DK", area_sqm: 42, rent: 95000, management_fee: 5000, status: "vacant" },
  // パークハイツ渋谷
  { id: "unit-11", company_id: "co-1", property_id: "prop-4", unit_number: "101", floor: 1, layout: "1K", area_sqm: 28, rent: 110000, management_fee: 8000, status: "occupied" },
  { id: "unit-12", company_id: "co-1", property_id: "prop-4", unit_number: "501", floor: 5, layout: "2LDK", area_sqm: 60, rent: 200000, management_fee: 12000, status: "occupied" },
  { id: "unit-13", company_id: "co-1", property_id: "prop-4", unit_number: "502", floor: 5, layout: "2LDK", area_sqm: 60, rent: 200000, management_fee: 12000, status: "maintenance" },
];

// 入居者
export const tenants: Tenant[] = [
  { id: "ten-1", company_id: "co-1", name: "山田 健太", name_kana: "ヤマダ ケンタ", phone: "080-1111-2222", email: "yamada@example.com", workplace: "株式会社テック" },
  { id: "ten-2", company_id: "co-1", name: "高橋 美咲", name_kana: "タカハシ ミサキ", phone: "080-3333-4444", email: "takahashi@example.com", workplace: "デザイン事務所" },
  { id: "ten-3", company_id: "co-1", name: "伊藤 大輔", name_kana: "イトウ ダイスケ", phone: "080-5555-6666", email: "ito@example.com", workplace: "商社株式会社" },
  { id: "ten-4", company_id: "co-1", name: "渡辺 さくら", name_kana: "ワタナベ サクラ", phone: "080-7777-8888", email: "watanabe@example.com", workplace: "看護師" },
  { id: "ten-5", company_id: "co-1", name: "中村 翔太", name_kana: "ナカムラ ショウタ", phone: "080-9999-0000", email: "nakamura@example.com", workplace: "フリーランス" },
  { id: "ten-6", company_id: "co-1", name: "小林 由美", name_kana: "コバヤシ ユミ", phone: "080-1234-5678", email: "kobayashi@example.com", workplace: "出版社" },
  { id: "ten-7", company_id: "co-1", name: "加藤 誠", name_kana: "カトウ マコト", phone: "080-2345-6789", email: "kato@example.com", workplace: "銀行" },
  { id: "ten-8", company_id: "co-1", name: "吉田 あかね", name_kana: "ヨシダ アカネ", phone: "080-3456-7890", email: "yoshida@example.com", workplace: "IT企業" },
  { id: "ten-9", company_id: "co-1", name: "松本 隆", name_kana: "マツモト タカシ", phone: "080-4567-8901", email: "matsumoto@example.com", workplace: "教師" },
];

// 契約
export const contracts: Contract[] = [
  { id: "con-1", company_id: "co-1", unit_id: "unit-1", tenant_id: "ten-1", contract_type: "ordinary", start_date: "2024-04-01", end_date: "2026-03-31", rent: 85000, management_fee: 5000, status: "active", move_in_date: "2024-04-01", tenant: tenants[0] },
  { id: "con-2", company_id: "co-1", unit_id: "unit-2", tenant_id: "ten-2", contract_type: "fixed", start_date: "2025-01-01", end_date: "2026-12-31", rent: 85000, management_fee: 5000, status: "active", move_in_date: "2025-01-01", tenant: tenants[1] },
  { id: "con-3", company_id: "co-1", unit_id: "unit-3", tenant_id: "ten-3", contract_type: "ordinary", start_date: "2023-07-01", end_date: "2025-06-30", rent: 120000, management_fee: 8000, status: "active", move_in_date: "2023-07-01", tenant: tenants[2] },
  { id: "con-4", company_id: "co-1", unit_id: "unit-5", tenant_id: "ten-4", contract_type: "ordinary", start_date: "2024-10-01", end_date: "2026-09-30", rent: 160000, management_fee: 10000, status: "active", move_in_date: "2024-10-01", tenant: tenants[3] },
  { id: "con-5", company_id: "co-1", unit_id: "unit-6", tenant_id: "ten-5", contract_type: "fixed", start_date: "2025-02-01", end_date: "2027-01-31", rent: 72000, management_fee: 4000, status: "active", move_in_date: "2025-02-01", tenant: tenants[4] },
  { id: "con-6", company_id: "co-1", unit_id: "unit-8", tenant_id: "ten-6", contract_type: "ordinary", start_date: "2024-06-01", end_date: "2026-05-31", rent: 105000, management_fee: 6000, status: "active", move_in_date: "2024-06-01", tenant: tenants[5] },
  { id: "con-7", company_id: "co-1", unit_id: "unit-9", tenant_id: "ten-7", contract_type: "ordinary", start_date: "2023-04-01", end_date: "2025-03-31", rent: 65000, management_fee: 3000, status: "active", move_in_date: "2023-04-01", tenant: tenants[6] },
  { id: "con-8", company_id: "co-1", unit_id: "unit-11", tenant_id: "ten-8", contract_type: "fixed", start_date: "2025-01-01", end_date: "2026-12-31", rent: 110000, management_fee: 8000, status: "active", move_in_date: "2025-01-01", tenant: tenants[7] },
  { id: "con-9", company_id: "co-1", unit_id: "unit-12", tenant_id: "ten-9", contract_type: "ordinary", start_date: "2024-08-01", end_date: "2026-07-31", rent: 200000, management_fee: 12000, status: "active", move_in_date: "2024-08-01", tenant: tenants[8] },
];

// 家賃請求（当月分）
export const rentBillings: RentBilling[] = [
  { id: "bill-1", company_id: "co-1", contract_id: "con-1", billing_month: "2026-02-01", rent: 85000, management_fee: 5000, total_amount: 90000, due_date: "2026-02-27", status: "paid" },
  { id: "bill-2", company_id: "co-1", contract_id: "con-2", billing_month: "2026-02-01", rent: 85000, management_fee: 5000, total_amount: 90000, due_date: "2026-02-27", status: "paid" },
  { id: "bill-3", company_id: "co-1", contract_id: "con-3", billing_month: "2026-02-01", rent: 120000, management_fee: 8000, total_amount: 128000, due_date: "2026-02-27", status: "paid" },
  { id: "bill-4", company_id: "co-1", contract_id: "con-4", billing_month: "2026-02-01", rent: 160000, management_fee: 10000, total_amount: 170000, due_date: "2026-02-27", status: "overdue" },
  { id: "bill-5", company_id: "co-1", contract_id: "con-5", billing_month: "2026-02-01", rent: 72000, management_fee: 4000, total_amount: 76000, due_date: "2026-02-27", status: "paid" },
  { id: "bill-6", company_id: "co-1", contract_id: "con-6", billing_month: "2026-02-01", rent: 105000, management_fee: 6000, total_amount: 111000, due_date: "2026-02-27", status: "paid" },
  { id: "bill-7", company_id: "co-1", contract_id: "con-7", billing_month: "2026-02-01", rent: 65000, management_fee: 3000, total_amount: 68000, due_date: "2026-02-27", status: "overdue" },
  { id: "bill-8", company_id: "co-1", contract_id: "con-8", billing_month: "2026-02-01", rent: 110000, management_fee: 8000, total_amount: 118000, due_date: "2026-02-27", status: "paid" },
  { id: "bill-9", company_id: "co-1", contract_id: "con-9", billing_month: "2026-02-01", rent: 200000, management_fee: 12000, total_amount: 212000, due_date: "2026-02-27", status: "unpaid" },
];

// 修繕依頼
export const maintenanceRequests: MaintenanceRequest[] = [
  {
    id: "maint-1",
    company_id: "co-1",
    property_id: "prop-1",
    unit_id: "unit-3",
    tenant_id: "ten-3",
    title: "エアコン故障",
    description: "冷房が効かない。室外機から異音がする。",
    category: "equipment",
    priority: "high",
    status: "in_progress",
    reported_date: "2026-02-20",
    vendor_name: "エアコン修理センター",
    estimated_cost: 35000,
    property: properties[0],
  },
  {
    id: "maint-2",
    company_id: "co-1",
    property_id: "prop-2",
    unit_id: "unit-6",
    tenant_id: "ten-5",
    title: "水漏れ",
    description: "キッチン下から水漏れ。",
    category: "plumbing",
    priority: "urgent",
    status: "open",
    reported_date: "2026-02-25",
    property: properties[1],
  },
  {
    id: "maint-3",
    company_id: "co-1",
    property_id: "prop-4",
    unit_id: "unit-13",
    title: "退去後リフォーム",
    description: "壁紙張替え、クリーニング",
    category: "other",
    priority: "normal",
    status: "open",
    reported_date: "2026-02-15",
    estimated_cost: 180000,
    property: properties[3],
  },
  {
    id: "maint-4",
    company_id: "co-1",
    property_id: "prop-3",
    unit_id: "unit-9",
    tenant_id: "ten-7",
    title: "給湯器の調子が悪い",
    description: "お湯の温度が安定しない",
    category: "equipment",
    priority: "normal",
    status: "completed",
    reported_date: "2026-02-01",
    completed_date: "2026-02-10",
    vendor_name: "設備メンテナンス",
    estimated_cost: 15000,
    actual_cost: 12000,
    property: properties[2],
  },
];

// 問い合わせ
export const inquiries: Inquiry[] = [
  {
    id: "inq-1",
    company_id: "co-1",
    property_id: "prop-1",
    tenant_id: "ten-1",
    inquiry_type: "noise",
    title: "上階の騒音",
    description: "夜間の足音が気になる",
    status: "in_progress",
    priority: "normal",
    created_at: "2026-02-22",
  },
  {
    id: "inq-2",
    company_id: "co-1",
    property_id: "prop-2",
    inquiry_type: "facility",
    title: "共用部の照明切れ",
    description: "2階廊下の蛍光灯が切れている",
    status: "open",
    priority: "low",
    created_at: "2026-02-24",
  },
];

// ダッシュボード統計
export const dashboardStats: DashboardStats = {
  total_properties: 4,
  total_units: 13,
  occupied_units: 9,
  vacant_units: 3, // 1つはmaintenance
  occupancy_rate: 69.2,
  total_rent_expected: 1063000,
  total_rent_received: 693000,
  collection_rate: 65.2,
  overdue_count: 2,
  overdue_amount: 238000,
  open_maintenance: 2,
  open_inquiries: 2,
  expiring_contracts: 1, // con-7: 2025-03-31
};
