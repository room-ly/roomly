// CSV生成ユーティリティ

interface CsvColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

// ネストされた値取得
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function generateCsv(
  data: Record<string, any>[],
  columns: CsvColumn[]
): string {
  // BOMを付加（Excelで日本語を正しく表示するため）
  const bom = "\uFEFF";

  // ヘッダー行
  const header = columns.map((col) => escapeField(col.label)).join(",");

  // データ行
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = getNestedValue(item, col.key);
        const formatted = col.format ? col.format(value) : String(value ?? "");
        return escapeField(formatted);
      })
      .join(",")
  );

  return bom + [header, ...rows].join("\n");
}

function escapeField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
