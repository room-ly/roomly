export function formatRent(amount: number): string {
  return amount.toLocaleString("ja-JP");
}

export function formatArea(sqm: number | null): string {
  if (!sqm) return "-";
  return `${Number(sqm).toFixed(1)}m²`;
}

export function structureLabel(s: string | null): string {
  if (!s) return "-";
  const map: Record<string, string> = {
    RC: "鉄筋コンクリート",
    SRC: "鉄骨鉄筋コンクリート",
    S: "鉄骨造",
    wood: "木造",
    light_steel: "軽量鉄骨",
  };
  return map[s] ?? s;
}

export function propertyTypeLabel(t: string): string {
  const map: Record<string, string> = {
    apartment: "マンション",
    house: "戸建て",
    commercial: "テナント",
    parking: "駐車場",
  };
  return map[t] ?? t;
}
