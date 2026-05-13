const ERAS = [
  { name: "令和", start: 2019 },
  { name: "平成", start: 1989 },
  { name: "昭和", start: 1926 },
  { name: "大正", start: 1912 },
  { name: "明治", start: 1868 },
] as const;

export function toWareki(year: number): string {
  for (const era of ERAS) {
    if (year >= era.start) {
      const eraYear = year - era.start + 1;
      return `${era.name}${eraYear === 1 ? "元" : eraYear}年`;
    }
  }
  return `${year}年`;
}

export function formatBuiltYear(builtYear: number): string {
  const age = new Date().getFullYear() - builtYear;
  return `${builtYear}年（${toWareki(builtYear)}・築${age}年）`;
}
