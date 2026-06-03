import { describe, it, expect } from "vitest";
import { generateSchedule } from "./loan-schedule";

describe("generateSchedule", () => {
  it("元利均等: 残高は最終回で必ず0になる", () => {
    const rows = generateSchedule({
      principal: 30_000_000,
      annualRatePercent: 1.875,
      termMonths: 360,
      firstPaymentDate: "2026-07-10",
      method: "equal_principal_and_interest",
    });
    expect(rows).toHaveLength(360);
    expect(rows[rows.length - 1].balance_after).toBe(0);
    // 元金合計は借入元本と一致する
    const totalPrincipal = rows.reduce((s, r) => s + r.principal_amount, 0);
    expect(totalPrincipal).toBe(30_000_000);
  });

  it("元利均等: 毎月の返済額（元金+利息）はほぼ一定", () => {
    const rows = generateSchedule({
      principal: 10_000_000,
      annualRatePercent: 2.0,
      termMonths: 120,
      firstPaymentDate: "2026-07-27",
      method: "equal_principal_and_interest",
    });
    const totals = rows.slice(0, -1).map((r) => r.principal_amount + r.interest_amount);
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    // 端数調整で±数円のブレは許容
    expect(max - min).toBeLessThanOrEqual(2);
  });

  it("元金均等: 毎月の元金はほぼ一定で、利息は逓減する", () => {
    const rows = generateSchedule({
      principal: 12_000_000,
      annualRatePercent: 1.5,
      termMonths: 240,
      firstPaymentDate: "2026-08-05",
      method: "equal_principal",
    });
    expect(rows[rows.length - 1].balance_after).toBe(0);
    expect(rows[0].interest_amount).toBeGreaterThan(rows[100].interest_amount);
    const totalPrincipal = rows.reduce((s, r) => s + r.principal_amount, 0);
    expect(totalPrincipal).toBe(12_000_000);
  });

  it("金利0%でも破綻せず元金を均等割りする", () => {
    const rows = generateSchedule({
      principal: 1_200_000,
      annualRatePercent: 0,
      termMonths: 12,
      firstPaymentDate: "2026-07-01",
      method: "equal_principal_and_interest",
    });
    expect(rows.every((r) => r.interest_amount === 0)).toBe(true);
    expect(rows[rows.length - 1].balance_after).toBe(0);
  });

  it("返済日は毎月同日、月末はクランプされる", () => {
    const rows = generateSchedule({
      principal: 1_000_000,
      annualRatePercent: 1,
      termMonths: 3,
      firstPaymentDate: "2026-01-31",
      method: "equal_principal",
    });
    expect(rows[0].payment_date).toBe("2026-01-31");
    expect(rows[1].payment_date).toBe("2026-02-28"); // 2月は末日にクランプ
    expect(rows[2].payment_date).toBe("2026-03-31");
  });

  it("不正な入力は空配列を返す", () => {
    expect(
      generateSchedule({
        principal: 0,
        annualRatePercent: 1,
        termMonths: 12,
        firstPaymentDate: "2026-07-01",
        method: "equal_principal",
      }),
    ).toEqual([]);
  });
});
