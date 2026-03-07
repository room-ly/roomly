import { describe, it, expect } from "vitest";
import { calcRemittance, type RemittanceCalcInput } from "./remittance-calc";

describe("calcRemittance", () => {
  const baseInput: RemittanceCalcInput = {
    ownerId: "owner-1",
    ownerName: "テスト太郎",
    managementFeeRate: 5.0,
    properties: [
      {
        propertyId: "prop-1",
        propertyName: "テストマンション",
        units: [
          { unitId: "u1", unitNumber: "101", rent: 80000, managementFee: 5000, isPaid: true },
          { unitId: "u2", unitNumber: "102", rent: 70000, managementFee: 5000, isPaid: true },
          { unitId: "u3", unitNumber: "103", rent: 90000, managementFee: 5000, isPaid: false },
        ],
      },
    ],
    expenses: [],
  };

  it("入金済みの家賃のみ集計する", () => {
    const result = calcRemittance(baseInput);
    // 101: 85000 + 102: 75000 = 160000
    expect(result.totalRent).toBe(160000);
  });

  it("管理手数料を正しく計算する", () => {
    const result = calcRemittance(baseInput);
    // 160000 * 5% = 8000
    expect(result.managementFeeDeducted).toBe(8000);
  });

  it("送金額 = 家賃 - 手数料 - 経費", () => {
    const result = calcRemittance(baseInput);
    expect(result.netAmount).toBe(160000 - 8000);
  });

  it("経費を控除する", () => {
    const input = {
      ...baseInput,
      expenses: [
        { description: "エアコン修理", amount: 30000, propertyId: "prop-1" },
        { description: "清掃費", amount: 10000 },
      ],
    };
    const result = calcRemittance(input);
    expect(result.expenseDeducted).toBe(40000);
    expect(result.netAmount).toBe(160000 - 8000 - 40000);
  });

  it("家賃が0の場合、手数料も0", () => {
    const input = {
      ...baseInput,
      properties: [{
        propertyId: "prop-1",
        propertyName: "テストマンション",
        units: [
          { unitId: "u1", unitNumber: "101", rent: 80000, managementFee: 5000, isPaid: false },
        ],
      }],
    };
    const result = calcRemittance(input);
    expect(result.totalRent).toBe(0);
    expect(result.managementFeeDeducted).toBe(0);
    expect(result.netAmount).toBe(0);
  });

  it("明細アイテムに正しい情報が含まれる", () => {
    const result = calcRemittance(baseInput);
    const rentItems = result.items.filter((i) => i.itemType === "rent");
    expect(rentItems).toHaveLength(2);
    expect(rentItems[0].unitNumber).toBe("101");
    expect(rentItems[0].amount).toBe(85000);
  });

  it("手数料率0%の場合、手数料は0", () => {
    const input = { ...baseInput, managementFeeRate: 0 };
    const result = calcRemittance(input);
    expect(result.managementFeeDeducted).toBe(0);
    expect(result.netAmount).toBe(160000);
  });

  it("複数物件を正しく集計する", () => {
    const input: RemittanceCalcInput = {
      ...baseInput,
      properties: [
        {
          propertyId: "prop-1",
          propertyName: "マンションA",
          units: [
            { unitId: "u1", unitNumber: "101", rent: 80000, managementFee: 5000, isPaid: true },
          ],
        },
        {
          propertyId: "prop-2",
          propertyName: "マンションB",
          units: [
            { unitId: "u2", unitNumber: "201", rent: 100000, managementFee: 8000, isPaid: true },
          ],
        },
      ],
    };
    const result = calcRemittance(input);
    expect(result.totalRent).toBe(85000 + 108000);
  });
});
