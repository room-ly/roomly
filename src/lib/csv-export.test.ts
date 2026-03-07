import { describe, it, expect } from "vitest";
import { generateCsv } from "./csv-export";

describe("generateCsv", () => {
  it("ヘッダーとデータ行を生成する", () => {
    const csv = generateCsv(
      [
        { name: "田中太郎", email: "tanaka@example.com" },
        { name: "佐藤花子", email: "sato@example.com" },
      ],
      [
        { key: "name", label: "氏名" },
        { key: "email", label: "メール" },
      ]
    );
    const lines = csv.split("\n");
    // BOM付き
    expect(lines[0]).toBe("\uFEFF氏名,メール");
    expect(lines[1]).toBe("田中太郎,tanaka@example.com");
    expect(lines[2]).toBe("佐藤花子,sato@example.com");
  });

  it("カンマを含む値をダブルクォートで囲む", () => {
    const csv = generateCsv(
      [{ address: "東京都新宿区, 西新宿1-1-1" }],
      [{ key: "address", label: "住所" }]
    );
    const lines = csv.split("\n");
    expect(lines[1]).toBe('"東京都新宿区, 西新宿1-1-1"');
  });

  it("NULL値を空文字で出力する", () => {
    const csv = generateCsv(
      [{ name: "田中太郎", phone: null }],
      [
        { key: "name", label: "名前" },
        { key: "phone", label: "電話" },
      ]
    );
    const lines = csv.split("\n");
    expect(lines[1]).toBe("田中太郎,");
  });

  it("ネストされたキーを取得する", () => {
    const csv = generateCsv(
      [{ contract: { tenant: { name: "田中太郎" } } }],
      [{ key: "contract.tenant.name", label: "入居者名" }]
    );
    const lines = csv.split("\n");
    expect(lines[1]).toBe("田中太郎");
  });

  it("format関数を使ってカスタム出力する", () => {
    const csv = generateCsv(
      [{ amount: 50000 }],
      [
        {
          key: "amount",
          label: "金額",
          format: (v: number) => `¥${v.toLocaleString()}`,
        },
      ]
    );
    const lines = csv.split("\n");
    // カンマが含まれるのでダブルクォートで囲まれる
    expect(lines[1]).toBe('"¥50,000"');
  });

  it("空配列の場合はヘッダーのみ", () => {
    const csv = generateCsv([], [{ key: "name", label: "名前" }]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("\uFEFF名前");
  });
});
