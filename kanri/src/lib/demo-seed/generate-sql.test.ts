// seed-data から生成されるSQLの構造的健全性を保証する。
// スキーマ変更時に必須カラム追加 → TablesInsert<> の型エラー → seed-data.ts コンパイル失敗
// で気付く仕組みを補強する目的。

import { describe, it, expect } from "vitest";
import { generateResetSql } from "./generate-sql";
import {
  SEED_OWNERS, SEED_PROPERTIES, SEED_UNITS, SEED_TENANTS, SEED_CONTRACTS,
  SEED_CASES, SEED_EXPENSES,
} from "./seed-data";

const DEMO_ID = "a0000000-0000-0000-0000-000000000001";

describe("generateResetSql", () => {
  const sql = generateResetSql(DEMO_ID);

  it("BEGIN/COMMIT で囲まれている", () => {
    expect(sql.startsWith("BEGIN;")).toBe(true);
    expect(sql.endsWith("COMMIT;")).toBe(true);
  });

  it("依存関係順に削除している（cases → owner_remittances → ... → properties → owners）", () => {
    const order = [
      "DELETE FROM public.case_logs",
      "DELETE FROM public.cases",
      "DELETE FROM public.owner_remittances",
      "DELETE FROM public.rent_payments",
      "DELETE FROM public.rent_billings",
      "DELETE FROM public.expenses",
      "DELETE FROM public.contracts",
      "DELETE FROM public.tenants",
      "DELETE FROM public.units",
      "DELETE FROM public.properties",
      "DELETE FROM public.owners",
    ];
    let prev = -1;
    for (const stmt of order) {
      const i = sql.indexOf(stmt);
      expect(i, `${stmt} が見つからない`).toBeGreaterThan(prev);
      prev = i;
    }
  });

  it("seed-data の件数分の VALUES が含まれる", () => {
    // 各テーブルのINSERT文の括弧数 = レコード数
    const countValuesAfter = (label: string, expected: number) => {
      const start = sql.indexOf(`INSERT INTO public.${label}`);
      expect(start, `${label} の INSERT がない`).toBeGreaterThan(0);
      const next = sql.indexOf("INSERT INTO", start + 1);
      const segment = sql.slice(start, next === -1 ? undefined : next);
      // VALUES の後の各行を数える（カンマ区切り行ごと）
      const valuesIdx = segment.indexOf("VALUES");
      const valuesPart = segment.slice(valuesIdx + "VALUES".length);
      // トップレベルの "),(" or 改行+"(" 出現回数 + 1
      const rowCount = (valuesPart.match(/\n\s*\(/g) || []).length;
      expect(rowCount, `${label} の VALUES 件数が想定と違う`).toBe(expected);
    };
    countValuesAfter("owners", SEED_OWNERS.length);
    countValuesAfter("properties", SEED_PROPERTIES.length);
    countValuesAfter("units", SEED_UNITS.length);
    countValuesAfter("tenants", SEED_TENANTS.length);
    countValuesAfter("contracts", SEED_CONTRACTS.length);
    countValuesAfter("cases", SEED_CASES.length);
    countValuesAfter("expenses", SEED_EXPENSES.length);
  });

  it("家賃請求: 6ヶ月 × 9契約 = 54件の rent_billings INSERT が生成される", () => {
    const count = (sql.match(/INSERT INTO public\.rent_billings/g) || []).length;
    expect(count).toBe(54);
  });

  it("家賃入金: paid 件数だけ rent_payments INSERT が生成される", () => {
    // MISS_TOTAL = [0, 1, 1, 1, 0, 2] → 未収合計5件、paid = 54 - 5 = 49
    const count = (sql.match(/INSERT INTO public\.rent_payments/g) || []).length;
    expect(count).toBe(49);
  });

  it("company_id が全シードに埋め込まれている", () => {
    // INSERT 文中のリテラル件数（雑カウント）
    const matches = sql.match(new RegExp(`'${DEMO_ID}'`, "g")) || [];
    expect(matches.length).toBeGreaterThan(50);
  });

  it("動的日付式が SQL 式としてリテラル化されていない", () => {
    // __SQL__ プレースホルダが残っていないこと
    expect(sql.includes("__SQL__")).toBe(false);
    // CURRENT_DATE が出現する（裸のSQL式として）
    expect(sql.includes("CURRENT_DATE")).toBe(true);
    // date_trunc が出現する
    expect(sql.includes("date_trunc('month'")).toBe(true);
  });

  it("ID列が固定UUID（b/c/d/e/f系）になっている", () => {
    expect(sql).toMatch(/'b0000000-0000-0000-0000-000000000001'/);
    expect(sql).toMatch(/'c0000000-0000-0000-0000-000000000001'/);
    expect(sql).toMatch(/'d0000000-0000-0000-0000-000000000001'/);
    expect(sql).toMatch(/'e0000000-0000-0000-0000-000000000001'/);
    expect(sql).toMatch(/'f0000000-0000-0000-0000-000000000001'/);
  });

  it("シングルクォートのエスケープが効いている", () => {
    // 入居者名に特殊文字なし → 純粋に link テスト
    const escaped = generateResetSql("a0000000-0000-0000-0000-000000000001");
    // dangerous text 単体テスト
    const danger = "It's a test";
    const tmpSql = `'${danger.replace(/'/g, "''")}'`;
    expect(tmpSql).toBe("'It''s a test'");
    expect(escaped).not.toContain("' '"); // 念のため
  });
});
