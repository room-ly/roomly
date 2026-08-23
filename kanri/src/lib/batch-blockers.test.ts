import { describe, it, expect } from "vitest";
import { detectBlockers, type BlockerInput } from "./batch-blockers";

const base: BlockerInput = {
  owner_rows: 2,
  owners_without_bank: [],
  expense_rows: 3,
  expenses_without_payee: 0,
  expenses_payee_no_bank: 0,
  month_paid_total: 500000,
  registered_owners: 2,
  confirmed_owners: 0,
  has_sender_account: true,
  selected_count: 1,
};

describe("detectBlockers", () => {
  // 実データで踏んだ不具合：入金があるのに「入金なし」と誤表示していた
  it("入金があり確定済みなら、入金なしとは案内しない", () => {
    const b = detectBlockers(
      { ...base, owner_rows: 0, expense_rows: 3, month_paid_total: 919000,
        confirmed_owners: 2, selected_count: 0 },
      "2026-08"
    );
    expect(b.some((x) => x.label.includes("家賃入金が登録されていない"))).toBe(false);
    expect(b.some((x) => x.label.includes("作成済みの振込データ"))).toBe(true);
  });

  it("対象皆無でも入金と確定があれば作成済みと案内する", () => {
    const b = detectBlockers(
      { ...base, owner_rows: 0, expense_rows: 0, month_paid_total: 919000,
        confirmed_owners: 2, selected_count: 0 },
      "2026-08"
    );
    expect(b[0].label).toContain("作成済みの振込データ");
    expect(b[0].href).toBeUndefined();
  });

  it("全て揃っていれば不足なし", () => {
    expect(detectBlockers(base, "2026-08")).toEqual([]);
  });

  it("未選択なら選択を促す", () => {
    const b = detectBlockers({ ...base, selected_count: 0 }, "2026-08");
    expect(b).toHaveLength(1);
    expect(b[0].label).toContain("チェックを入れて");
    expect(b[0].kind).toBe("pending");
  });

  it("振込元口座がなければ設定画面へ誘導する", () => {
    const b = detectBlockers({ ...base, has_sender_account: false }, "2026-08");
    expect(b[0].href).toBe("/settings");
    expect(b[0].kind).not.toBe("pending");
  });

  it("対象が皆無で入金もなければ家賃画面へ誘導する", () => {
    const b = detectBlockers(
      { ...base, owner_rows: 0, expense_rows: 0, month_paid_total: 0, selected_count: 0 },
      "2026-08"
    );
    expect(b[0].label).toContain("家賃入金が登録されていないため");
    expect(b[0].href).toBe("/rent");
  });

  it("オーナー未登録が最優先で案内される", () => {
    const b = detectBlockers(
      { ...base, owner_rows: 0, expense_rows: 0, registered_owners: 0, month_paid_total: 0, selected_count: 0 },
      "2026-08"
    );
    expect(b[0].label).toBe("オーナーが登録されていません");
    expect(b[0].href).toBe("/owners");
  });

  it("支払先未設定は同一画面で解決するのでhrefを持たない", () => {
    const b = detectBlockers({ ...base, expenses_without_payee: 2 }, "2026-08");
    const e = b.find((x) => x.label.includes("支払先"));
    expect(e?.label).toContain("2件");
    expect(e?.href).toBeUndefined();
  });

  it("口座未登録のオーナー名を列挙する", () => {
    const b = detectBlockers({ ...base, owners_without_bank: ["田中 太郎"] }, "2026-08");
    expect(b[0].label).toContain("田中 太郎");
    expect(b[0].href).toBe("/owners");
  });

  it("支払先はあるが口座情報がない場合は支払先画面へ誘導する", () => {
    const b = detectBlockers({ ...base, expenses_payee_no_bank: 1 }, "2026-08");
    expect(b[0].href).toBe("/payees");
  });

  it("不足が複数あれば全て列挙する", () => {
    const b = detectBlockers(
      { ...base, has_sender_account: false, expenses_without_payee: 1, owners_without_bank: ["鈴木"] },
      "2026-08"
    );
    expect(b.length).toBe(3);
  });

  it("不足がある場合は「チェックを入れて」を出さない（原因を優先）", () => {
    const b = detectBlockers({ ...base, has_sender_account: false, selected_count: 0 }, "2026-08");
    expect(b.some((x) => x.label.includes("チェック"))).toBe(false);
  });
});

// 実データで踏んだ不具合：カナ名義のみのオーナーが「口座未登録」と誤判定されていた
describe("口座名義フィールドの移行対応", () => {
  it("口座情報が揃っていれば不足として出さない", () => {
    const b = detectBlockers(
      {
        owner_rows: 1, owners_without_bank: [], expense_rows: 0,
        expenses_without_payee: 0, expenses_payee_no_bank: 0,
        month_paid_total: 600000, registered_owners: 1,
        confirmed_owners: 0, has_sender_account: true, selected_count: 1,
      },
      "2026-07"
    );
    expect(b).toEqual([]);
  });
});
