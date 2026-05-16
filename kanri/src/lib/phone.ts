// 電話番号のハイフン除去（保存用）
export function stripPhone(value: string): string {
  return value.replace(/[-\s()]/g, "");
}

// 電話番号のフォーマット（表示用）
// 11桁（携帯）: xxx-xxxx-xxxx
// 10桁（固定）: xx-xxxx-xxxx
// それ以外: そのまま返す
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/[^\d]/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
}
