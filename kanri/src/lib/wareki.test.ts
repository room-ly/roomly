import { describe, expect, it } from "vitest";
import { toWareki, formatBuiltYear } from "./wareki";

describe("toWareki", () => {
  it("令和", () => {
    expect(toWareki(2019)).toBe("令和元年");
    expect(toWareki(2020)).toBe("令和2年");
    expect(toWareki(2026)).toBe("令和8年");
  });

  it("平成", () => {
    expect(toWareki(1989)).toBe("平成元年");
    expect(toWareki(2000)).toBe("平成12年");
    expect(toWareki(2018)).toBe("平成30年");
  });

  it("昭和", () => {
    expect(toWareki(1926)).toBe("昭和元年");
    expect(toWareki(1970)).toBe("昭和45年");
    expect(toWareki(1988)).toBe("昭和63年");
  });

  it("大正", () => {
    expect(toWareki(1912)).toBe("大正元年");
    expect(toWareki(1925)).toBe("大正14年");
  });

  it("明治", () => {
    expect(toWareki(1868)).toBe("明治元年");
    expect(toWareki(1911)).toBe("明治44年");
  });

  it("明治以前はそのまま西暦", () => {
    expect(toWareki(1867)).toBe("1867年");
  });
});

describe("formatBuiltYear", () => {
  it("西暦・和暦・築年数をすべて含む", () => {
    const result = formatBuiltYear(2020);
    expect(result).toContain("2020年");
    expect(result).toContain("令和2年");
    expect(result).toContain("築");
  });

  it("スラッシュ区切りで両方表示", () => {
    expect(formatBuiltYear(1990)).toBe("1990年 / 平成2年（築36年）");
  });
});
