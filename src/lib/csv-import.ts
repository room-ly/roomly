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
  { csvHeader: "物件名", dbField: "name", required: true },
  { csvHeader: "住所", dbField: "address", required: true },
  { csvHeader: "種別", dbField: "property_type" },
  { csvHeader: "構造", dbField: "structure" },
  { csvHeader: "築年", dbField: "built_year" },
  { csvHeader: "階数", dbField: "floors" },
  { csvHeader: "最寄り駅", dbField: "nearest_station" },
  { csvHeader: "徒歩（分）", dbField: "walk_minutes" },
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
  アパート: "apartment",
  戸建て: "house",
  戸建: "house",
  house: "house",
  商業: "commercial",
  商業施設: "commercial",
  commercial: "commercial",
  駐車場: "parking",
  parking: "parking",
};

// CSVの行をDBカラムにマッピング
export function mapRowToDb(
  row: Record<string, string>,
  columns: ColumnMapping[],
  type: "properties" | "tenants"
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
      data[col.dbField] = null;
      continue;
    }

    // 型変換
    if (col.dbField === "property_type") {
      const mapped = PROPERTY_TYPE_MAP[value];
      if (!mapped) {
        errors.push(
          `「${value}」は無効な物件種別です（マンション/戸建て/商業/駐車場）`
        );
      } else {
        data[col.dbField] = mapped;
      }
    } else if (
      ["built_year", "floors", "walk_minutes"].includes(col.dbField)
    ) {
      const num = parseInt(value.replace(/[^\d]/g, ""), 10);
      if (isNaN(num)) {
        errors.push(`「${col.csvHeader}」は数値で入力してください`);
      } else {
        data[col.dbField] = num;
      }
    } else {
      data[col.dbField] = value;
    }
  }

  // デフォルト値
  if (type === "properties" && !data.property_type) {
    data.property_type = "apartment";
  }

  return { data, errors };
}

// サンプルCSV生成
export function generateSampleCsv(columns: ColumnMapping[]): string {
  const bom = "\uFEFF";
  const header = columns.map((c) => c.csvHeader).join(",");

  const sampleData: Record<string, string[]> = {
    物件名: ["サンプルマンションA", "サンプルハイツB"],
    住所: ["東京都新宿区西新宿1-1-1", "東京都渋谷区渋谷2-2-2"],
    種別: ["マンション", "アパート"],
    構造: ["RC", "木造"],
    築年: ["2010", "2015"],
    階数: ["5", "3"],
    最寄り駅: ["新宿駅", "渋谷駅"],
    "徒歩（分）": ["5", "8"],
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
