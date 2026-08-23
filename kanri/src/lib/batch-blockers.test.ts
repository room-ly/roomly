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
  has_sender_account: true,
  selected_count: 1,
};

describe("detectBlockers", () => {
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
