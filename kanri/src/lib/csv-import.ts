import { stripPhone } from "./phone";

// CSVパース・インポートユーティリティ

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

// CSVテキストをパースして配列に変換
export function parseCsv(text: string): CsvParseResult {
  // BOM除去
  const cleaned = text.replace(/^\uFEFF/, "");
  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ["CSVファイルが空です"] };
  }

  const headers = parseRow(lines[0]);
  if (headers.length === 0) {
    return { headers: [], rows: [], errors: ["ヘッダー行が読み取れません"] };
  }

  const rows: Record<string, string>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length !== headers.length) {
      errors.push(
        `${i + 1}行目: 列数が一致しません（期待: ${headers.length}列、実際: ${values.length}列）`
      );
      continue;
    }
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });
    rows.push(row);
  }

  return { headers, rows, errors };
}

// CSV行をパース（ダブルクォート対応）
function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

// インポート種別ごとのカラムマッピング定義
export interface ColumnMapping {
  csvHeader: string; // CSVのヘッダー名
  dbField: string; // DBのカラム名
  required?: boolean;
}

export const PROPERTY_COLUMNS: ColumnMapping[] = [
  // 基本情報
  { csvHeader: "物件名", dbField: "name", required: true },
  { csvHeader: "物件名カナ", dbField: "name_kana" },
  { csvHeader: "物件コード", dbField: "property_code" },
  { csvHeader: "種別", dbField: "property_type" },
  // 所在地
  { csvHeader: "郵便番号", dbField: "postal_code" },
  { csvHeader: "都道府県", dbField: "prefecture" },
  { csvHeader: "市区町村", dbField: "city" },
  { csvHeader: "町名・番地", dbField: "town" },
  { csvHeader: "住所", dbField: "address", required: true },
  { csvHeader: "建物番号・部屋", dbField: "building_number" },
  // 交通
  { csvHeader: "最寄り駅", dbField: "nearest_station" },
  { csvHeader: "徒歩（分）", dbField: "walk_minutes" },
  { csvHeader: "最寄り駅2", dbField: "nearest_station_2" },
  { csvHeader: "徒歩2（分）", dbField: "walk_minutes_2" },
  { csvHeader: "最寄り駅3", dbField: "nearest_station_3" },
  { csvHeader: "徒歩3（分）", dbField: "walk_minutes_3" },
  { csvHeader: "バス停", dbField: "bus_station" },
  { csvHeader: "バス（分）", dbField: "bus_minutes" },
  // 建物
  { csvHeader: "構造", dbField: "structure" },
  { csvHeader: "階数", dbField: "floors" },
  { csvHeader: "地下階数", dbField: "underground_floors" },
  { csvHeader: "築年", dbField: "built_year" },
  { csvHeader: "築月", dbField: "built_month" },
  { csvHeader: "総戸数", dbField: "total_units" },
  { csvHeader: "建物面積（m2）", dbField: "building_area_sqm" },
  { csvHeader: "土地面積（m2）", dbField: "land_area_sqm" },
  // 管理・設備
  { csvHeader: "管理形態", dbField: "management_form" },
  { csvHeader: "管理会社", dbField: "management_company" },
  { csvHeader: "管理手数料率（%）", dbField: "management_fee_rate" },
  { csvHeader: "管理手数料方式", dbField: "management_fee_type" },
  { csvHeader: "管理手数料固定額（円）", dbField: "management_fee_amount" },
  { csvHeader: "駐車場", dbField: "parking" },
  { csvHeader: "駐車場料金", dbField: "parking_fee" },
  { csvHeader: "駐輪場", dbField: "bicycle_parking" },
  { csvHeader: "バイク置場", dbField: "bike_parking" },
  { csvHeader: "共用設備", dbField: "common_facilities" },
  // 取引・自由入力
  { csvHeader: "取引態様", dbField: "transaction_type" },
  { csvHeader: "アピールポイント", dbField: "appeal_points" },
  { csvHeader: "備考", dbField: "notes" },
];

export const UNIT_COLUMNS: ColumnMapping[] = [
  { csvHeader: "部屋番号", dbField: "unit_number", required: true },
  { csvHeader: "階", dbField: "floor" },
  { csvHeader: "間取り", dbField: "layout" },
  { csvHeader: "面積（m2）", dbField: "area_sqm" },
  { csvHeader: "賃料", dbField: "rent", required: true },
  { csvHeader: "管理費", dbField: "management_fee", required: true },
  { csvHeader: "敷金", dbField: "deposit" },
  { csvHeader: "礼金", dbField: "key_money" },
  { csvHeader: "状態", dbField: "status" },
  { csvHeader: "設備", dbField: "equipment" },
  { csvHeader: "既存の損傷・汚損メモ", dbField: "damage_notes" },
  { csvHeader: "備考", dbField: "notes" },
];

export const TENANT_COLUMNS: ColumnMapping[] = [
  { csvHeader: "氏名", dbField: "name", required: true },
  { csvHeader: "フリガナ", dbField: "name_kana" },
  { csvHeader: "電話番号", dbField: "phone" },
  { csvHeader: "メール", dbField: "email" },
  { csvHeader: "勤務先", dbField: "workplace" },
  { csvHeader: "緊急連絡先（氏名）", dbField: "emergency_contact_name" },
  { csvHeader: "緊急連絡先（電話）", dbField: "emergency_contact_phone" },
];

// 物件種別の日本語→DB値変換
const PROPERTY_TYPE_MAP: Record<string, string> = {
  マンション: "apartment",
  apartment: "apartment",
  アパート: "apart",
  apart: "apart",
  戸建て: "house",
  戸建: "house",
  house: "house",
  商業: "commercial",
  商業施設: "commercial",
  店舗: "commercial",
  事務所: "commercial",
  commercial: "commercial",
  駐車場: "parking",
  parking: "parking",
  土地: "land",
  land: "land",
};

// 管理形態の日本語→DB値変換
const MANAGEMENT_FORM_MAP: Record<string, string> = {
  自主管理: "self",
  self: "self",
  全部委託: "full_management",
  full_management: "full_management",
  一部委託: "partial_management",
  partial_management: "partial_management",
  サブリース: "sublet",
  sublet: "sublet",
};

// 取引態様の日本語→DB値変換
const TRANSACTION_TYPE_MAP: Record<string, string> = {
  売主: "owner",
  貸主: "owner",
  owner: "owner",
  代理: "agent",
  agent: "agent",
  媒介: "intermediary",
  仲介: "intermediary",
  intermediary: "intermediary",
  サブリース: "sublet",
  sublet: "sublet",
};

// 部屋の状態の日本語→DB値変換
const UNIT_STATUS_MAP: Record<string, string> = {
  空室: "vacant",
  vacant: "vacant",
  入居中: "occupied",
  occupied: "occupied",
  申込中: "reserved",
  reserved: "reserved",
  メンテ中: "maintenance",
  メンテナンス: "maintenance",
  maintenance: "maintenance",
};

// 整数として扱うフィールド
const INT_FIELDS = new Set([
  "built_year",
  "built_month",
  "floors",
  "underground_floors",
  "total_units",
  "walk_minutes",
  "walk_minutes_2",
  "walk_minutes_3",
  "bus_minutes",
  "floor",
]);

// 小数を許容する数値フィールド
const NUMBER_FIELDS = new Set([
  "management_fee_rate",
  "management_fee_amount",
  "parking_fee",
  "building_area_sqm",
  "land_area_sqm",
  "area_sqm",
  "rent",
  "management_fee",
  "deposit",
  "key_money",
]);

// 配列（複数値）として扱うフィールド。「/」「・」「,」「、」で区切る
const ARRAY_FIELDS = new Set(["common_facilities", "equipment"]);

// CSVの行をDBカラムにマッピング
export function mapRowToDb(
  row: Record<string, string>,
  columns: ColumnMapping[],
  type: "properties" | "tenants" | "units"
): { data: Record<string, unknown>; errors: string[] } {
  const data: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const col of columns) {
    const value = row[col.csvHeader] ?? "";

    if (col.required && !value) {
      errors.push(`「${col.csvHeader}」は必須です`);
      continue;
    }

    if (!value) {
      // 配列フィールドの空欄は空配列ではなくnull扱い（未指定）
      data[col.dbField] = null;
      continue;
    }

    // 型変換
    if (col.dbField === "property_type") {
      const mapped = PROPERTY_TYPE_MAP[value];
      if (!mapped) {
        errors.push(
          `「${value}」は無効な物件種別です（マンション/アパート/戸建て/商業/駐車場/土地）`
        );
      } else {
        data[col.dbField] = mapped;
      }
    } else if (col.dbField === "management_form") {
      const mapped = MANAGEMENT_FORM_MAP[value];
      if (!mapped) {
        errors.push(
          `「${value}」は無効な管理形態です（自主管理/全部委託/一部委託/サブリース）`
        );
      } else {
        data[col.dbField] = mapped;
      }
    } else if (col.dbField === "transaction_type") {
      const mapped = TRANSACTION_TYPE_MAP[value];
      if (!mapped) {
        errors.push(
          `「${value}」は無効な取引態様です（売主/代理/媒介/サブリース）`
        );
      } else {
        data[col.dbField] = mapped;
      }
    } else if (col.dbField === "status") {
      const mapped = UNIT_STATUS_MAP[value];
      if (!mapped) {
        errors.push(
          `「${value}」は無効な状態です（空室/入居中/申込中/メンテ中）`
        );
      } else {
        data[col.dbField] = mapped;
      }
    } else if (ARRAY_FIELDS.has(col.dbField)) {
      const items = value
        .split(/[\/・,、]/)
        .map((s) => s.trim())
        .filter((s) => s !== "");
      data[col.dbField] = items.length > 0 ? items : null;
    } else if (INT_FIELDS.has(col.dbField)) {
      const num = parseInt(value.replace(/[^\d-]/g, ""), 10);
      if (isNaN(num)) {
        errors.push(`「${col.csvHeader}」は数値で入力してください`);
      } else {
        data[col.dbField] = num;
      }
    } else if (NUMBER_FIELDS.has(col.dbField)) {
      const num = parseFloat(value.replace(/[^\d.-]/g, ""));
      if (isNaN(num)) {
        errors.push(`「${col.csvHeader}」は数値で入力してください`);
      } else if (num < 0) {
        errors.push(`「${col.csvHeader}」は0以上で入力してください`);
      } else {
        data[col.dbField] = num;
      }
    } else if (["phone", "emergency_contact_phone"].includes(col.dbField)) {
      data[col.dbField] = stripPhone(value);
    } else {
      data[col.dbField] = value;
    }
  }

  // デフォルト値
  if (type === "properties" && !data.property_type) {
    data.property_type = "apartment";
  }
  if (type === "units") {
    if (!data.status) data.status = "vacant";
    // 管理費はDBで NOT NULL。未指定なら0
    if (data.management_fee == null) data.management_fee = 0;
  }

  return { data, errors };
}

// サンプルCSV生成
export function generateSampleCsv(columns: ColumnMapping[]): string {
  const bom = "\uFEFF";
  const header = columns.map((c) => c.csvHeader).join(",");

  const sampleData: Record<string, string[]> = {
    // 物件
    物件名: ["サンプルマンションA", "サンプルハイツB"],
    物件名カナ: ["サンプルマンションエー", "サンプルハイツビー"],
    物件コード: ["BLD-001", "BLD-002"],
    種別: ["マンション", "アパート"],
    郵便番号: ["160-0023", "150-0002"],
    都道府県: ["東京都", "東京都"],
    市区町村: ["新宿区", "渋谷区"],
    "町名・番地": ["西新宿1-1-1", "渋谷2-2-2"],
    住所: ["東京都新宿区西新宿1-1-1", "東京都渋谷区渋谷2-2-2"],
    "建物番号・部屋": ["", ""],
    最寄り駅: ["新宿駅", "渋谷駅"],
    "徒歩（分）": ["5", "8"],
    最寄り駅2: ["新宿三丁目駅", ""],
    "徒歩2（分）": ["7", ""],
    最寄り駅3: ["", ""],
    "徒歩3（分）": ["", ""],
    バス停: ["", ""],
    "バス（分）": ["", ""],
    構造: ["RC", "木造"],
    階数: ["5", "3"],
    地下階数: ["", ""],
    築年: ["2010", "2015"],
    築月: ["4", "10"],
    総戸数: ["20", "9"],
    "建物面積（m2）": ["1200.5", "450"],
    "土地面積（m2）": ["300", "200"],
    管理形態: ["全部委託", "自主管理"],
    管理会社: ["サンプル管理株式会社", ""],
    "管理手数料率（%）": ["5", ""],
    管理手数料方式: ["rate", "rate"],
    "管理手数料固定額（円）": ["", ""],
    駐車場: ["有（空き2台）", "無"],
    駐車場料金: ["15000", ""],
    駐輪場: ["有", "無"],
    バイク置場: ["", ""],
    共用設備: ["オートロック・エレベーター・宅配ボックス", "駐輪場"],
    取引態様: ["媒介", "貸主"],
    アピールポイント: ["駅近・築浅", "閑静な住宅街"],
    備考: ["", ""],
    // 部屋
    部屋番号: ["101", "102"],
    階: ["1", "1"],
    間取り: ["1LDK", "ワンルーム"],
    "面積（m2）": ["35.5", "22"],
    賃料: ["80000", "65000"],
    管理費: ["5000", "3000"],
    敷金: ["80000", "0"],
    礼金: ["80000", "0"],
    状態: ["空室", "入居中"],
    設備: ["エアコン・独立洗面台・追い焚き", "エアコン"],
    "既存の損傷・汚損メモ": ["", ""],
    // 入居者
    氏名: ["田中太郎", "佐藤花子"],
    フリガナ: ["タナカタロウ", "サトウハナコ"],
    電話番号: ["090-1234-5678", "080-9876-5432"],
    メール: ["tanaka@example.com", "sato@example.com"],
    勤務先: ["株式会社サンプル", "サンプル商事"],
    "緊急連絡先（氏名）": ["田中次郎", "佐藤一郎"],
    "緊急連絡先（電話）": ["03-1234-5678", "03-9876-5432"],
  };

  const rows = [0, 1].map((i) =>
    columns.map((c) => sampleData[c.csvHeader]?.[i] ?? "").join(",")
  );

  return bom + [header, ...rows].join("\n");
}
