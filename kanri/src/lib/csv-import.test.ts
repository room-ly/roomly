import { describe, it, expect } from "vitest";
import {
  parseCsv,
  mapRowToDb,
  PROPERTY_COLUMNS,
  UNIT_COLUMNS,
} from "./csv-import";

describe("parseCsv", () => {
  it("BOMを除去しヘッダーと行をパースする", () => {
    const csv = "﻿物件名,住所\nサンプルA,東京都新宿区";
    const { headers, rows, errors } = parseCsv(csv);
    expect(errors).toHaveLength(0);
    expect(headers).toEqual(["物件名", "住所"]);
    expect(rows[0]).toEqual({ 物件名: "サンプルA", 住所: "東京都新宿区" });
  });

  it("列数不一致の行をエラーにする", () => {
    const csv = "物件名,住所\nサンプルA";
    const { rows, errors } = parseCsv(csv);
    expect(rows).toHaveLength(0);
    expect(errors[0]).toContain("列数が一致しません");
  });
});

describe("mapRowToDb（物件）", () => {
  function mapProperty(row: Record<string, string>) {
    return mapRowToDb(row, PROPERTY_COLUMNS, "properties");
  }

  it("必須項目が欠けるとエラー", () => {
    const { errors } = mapProperty({ 物件名: "", 住所: "東京" });
    expect(errors.some((e) => e.includes("物件名"))).toBe(true);
  });

  it("物件種別を日本語からDB値に変換する", () => {
    expect(mapProperty({ 物件名: "A", 住所: "東京", 種別: "アパート" }).data.property_type).toBe("apart");
    expect(mapProperty({ 物件名: "A", 住所: "東京", 種別: "土地" }).data.property_type).toBe("land");
    expect(mapProperty({ 物件名: "A", 住所: "東京", 種別: "マンション" }).data.property_type).toBe("apartment");
  });

  it("無効な種別はエラー", () => {
    const { errors } = mapProperty({ 物件名: "A", 住所: "東京", 種別: "城" });
    expect(errors.some((e) => e.includes("無効な物件種別"))).toBe(true);
  });

  it("種別未指定はapartmentを既定値にする", () => {
    expect(mapProperty({ 物件名: "A", 住所: "東京" }).data.property_type).toBe("apartment");
  });

  it("管理形態・取引態様を変換する", () => {
    const { data } = mapProperty({
      物件名: "A",
      住所: "東京",
      管理形態: "全部委託",
      取引態様: "媒介",
    });
    expect(data.management_form).toBe("full_management");
    expect(data.transaction_type).toBe("intermediary");
  });

  it("整数・数値フィールドを変換し単位付き文字を除去する", () => {
    const { data, errors } = mapProperty({
      物件名: "A",
      住所: "東京",
      築年: "2010年",
      "建物面積（m2）": "1200.5",
      "管理手数料率（%）": "5",
    });
    expect(errors).toHaveLength(0);
    expect(data.built_year).toBe(2010);
    expect(data.building_area_sqm).toBe(1200.5);
    expect(data.management_fee_rate).toBe(5);
  });

  it("負の数値はエラー", () => {
    const { errors } = mapProperty({ 物件名: "A", 住所: "東京", 駐車場料金: "-100" });
    expect(errors.some((e) => e.includes("0以上"))).toBe(true);
  });

  it("共用設備を区切り文字で配列化する", () => {
    const { data } = mapProperty({
      物件名: "A",
      住所: "東京",
      共用設備: "オートロック・エレベーター・宅配ボックス",
    });
    expect(data.common_facilities).toEqual([
      "オートロック",
      "エレベーター",
      "宅配ボックス",
    ]);
  });

  it("空欄はnullになる", () => {
    const { data } = mapProperty({ 物件名: "A", 住所: "東京", 最寄り駅: "" });
    expect(data.nearest_station).toBeNull();
  });
});

describe("mapRowToDb（部屋）", () => {
  function mapUnit(row: Record<string, string>) {
    return mapRowToDb(row, UNIT_COLUMNS, "units");
  }

  it("部屋番号・賃料・管理費が必須", () => {
    const { errors } = mapUnit({ 部屋番号: "", 賃料: "", 管理費: "" });
    expect(errors.some((e) => e.includes("部屋番号"))).toBe(true);
    expect(errors.some((e) => e.includes("賃料"))).toBe(true);
    expect(errors.some((e) => e.includes("管理費"))).toBe(true);
  });

  it("状態を日本語からDB値に変換する", () => {
    expect(mapUnit({ 部屋番号: "101", 賃料: "80000", 管理費: "5000", 状態: "入居中" }).data.status).toBe("occupied");
  });

  it("状態未指定はvacantを既定値にする", () => {
    expect(mapUnit({ 部屋番号: "101", 賃料: "80000", 管理費: "5000" }).data.status).toBe("vacant");
  });

  it("設備を配列化する", () => {
    const { data } = mapUnit({
      部屋番号: "101",
      賃料: "80000",
      管理費: "5000",
      設備: "エアコン・独立洗面台",
    });
    expect(data.equipment).toEqual(["エアコン", "独立洗面台"]);
  });

  it("敷金・礼金を数値変換する", () => {
    const { data } = mapUnit({
      部屋番号: "101",
      賃料: "80000",
      管理費: "5000",
      敷金: "80000",
      礼金: "0",
    });
    expect(data.deposit).toBe(80000);
    expect(data.key_money).toBe(0);
  });
});
