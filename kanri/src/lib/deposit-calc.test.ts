import { describe, it, expect } from "vitest";
import { computeDepositBalance } from "./deposit-calc";

describe("computeDepositBalance", () => {
  it("初期敷金のみなら残高=初期敷金", () => {
    const s = computeDepositBalance(400000, []);
    expect(s.balance).toBe(400000);
  });

  it("取崩しは残高を減らす", () => {
    const s = computeDepositBalance(400000, [{ transaction_type: "charge", amount: 20000 }]);
    expect(s.charged).toBe(20000);
    expect(s.balance).toBe(380000);
  });

  it("返金も残高を減らす（取崩し後の残額を返金すると残高0）", () => {
    const s = computeDepositBalance(400000, [
      { transaction_type: "charge", amount: 20000 },
      { transaction_type: "refund", amount: 380000 },
    ]);
    expect(s.charged).toBe(20000);
    expect(s.refunded).toBe(380000);
    expect(s.balance).toBe(0);
  });

  it("initial_deposit トランザクションは初期敷金に加算", () => {
    const s = computeDepositBalance(400000, [
      { transaction_type: "initial_deposit", amount: 50000 },
    ]);
    expect(s.initial).toBe(450000);
    expect(s.balance).toBe(450000);
  });

  it("additional_billing は残高に影響しない", () => {
    const s = computeDepositBalance(400000, [
      { transaction_type: "charge", amount: 500000 },
      { transaction_type: "additional_billing", amount: 100000 },
    ]);
    expect(s.additionalBilled).toBe(100000);
    expect(s.balance).toBe(-100000); // 取崩しが敷金超過。不足は追加請求で別途回収
  });
});
