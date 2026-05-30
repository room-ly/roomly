// 敷金・礼金の単位（円 / ヶ月）を扱うユーティリティ
// DB上は deposit / key_money カラムに数値、deposit_unit / key_money_unit に 'jpy' | 'months' が入る。
// 'months' の場合は賃料に乗じて円に換算する。

export type DepositUnit = "jpy" | "months";

export function normalizeUnit(value: unknown): DepositUnit {
  return value === "months" ? "months" : "jpy";
}

// 値と単位、賃料から円換算した整数を返す。
export function toJpy(value: unknown, unit: unknown, rent: unknown): number {
  const v = Number(value) || 0;
  if (normalizeUnit(unit) === "months") {
    return Math.round(v * (Number(rent) || 0));
  }
  return Math.round(v);
}

// 表示用文字列（編集画面外の閲覧表示で使う）
// months の場合は「2ヶ月（¥160,000）」のように両方見せる。
export function formatDeposit(value: unknown, unit: unknown, rent: unknown): string {
  const v = Number(value) || 0;
  if (normalizeUnit(unit) === "months") {
    const jpy = toJpy(v, "months", rent);
    const monthsLabel = Number.isInteger(v) ? `${v}ヶ月` : `${v}ヶ月`;
    return `${monthsLabel}（¥${jpy.toLocaleString()}）`;
  }
  return `¥${Math.round(v).toLocaleString()}`;
}
