import { describe, it, expect } from "vitest";
import {
  planBulkGeneration,
  ownersMissingBank,
  buildBulkNotificationTitle,
  type BulkTarget,
} from "./bulk-remittance";

const t = (over: Partial<BulkTarget> = {}): BulkTarget => ({
  owner_id: "o1",
  owner_name: "テスト太郎",
  existing_remittance_id: null,
  has_bank: true,
  ...over,
});

describe("planBulkGeneration", () => {
  it("既存送金がなければ新規作成にする", () => {
    const plan = planBulkGeneration([t()]);
    expect(plan).toHaveLength(1);
    expect(plan[0].kind).toBe("create");
  });

  it("既存draftがあれば再利用（二重生成しない）", () => {
    const plan = planBulkGeneration([t({ existing_remittance_id: "r1" })]);
    expect(plan[0].kind).toBe("reuse");
    expect(plan[0].kind === "reuse" && plan[0].remittance_id).toBe("r1");
  });

  it("新規と既存が混在しても件数と順序を保つ", () => {
    const plan = planBulkGeneration([
      t({ owner_id: "a" }),
      t({ owner_id: "b", existing_remittance_id: "r-b" }),
      t({ owner_id: "c" }),
    ]);
    expect(plan.map((p) => p.kind)).toEqual(["create", "reuse", "create"]);
  });

  it("候補が空なら何もしない", () => {
    expect(planBulkGeneration([])).toEqual([]);
  });
});

describe("ownersMissingBank", () => {
  it("口座情報なしのオーナー名だけ返す", () => {
    const names = ownersMissingBank([
      t({ owner_name: "有り", has_bank: true }),
      t({ owner_name: "無し", has_bank: false }),
    ]);
    expect(names).toEqual(["無し"]);
  });

  it("全員口座ありなら空", () => {
    expect(ownersMissingBank([t(), t()])).toEqual([]);
  });
});

describe("buildBulkNotificationTitle", () => {
  it("生成のみ", () => {
    const title = buildBulkNotificationTitle("2026-08-01", {
      generated: 3, confirmed: 0, skipped: 0, failed: [],
    });
    expect(title).toBe("オーナー送金一括生成: 2026-08分 3件生成");
  });

  it("確定・失敗を含む", () => {
    const title = buildBulkNotificationTitle("2026-08-01", {
      generated: 3, confirmed: 3, skipped: 1,
      failed: [{ owner_id: "x", owner_name: "失敗太郎", reason: "err" }],
    });
    expect(title).toBe("オーナー送金一括生成: 2026-08分 3件生成・3件確定・1件失敗");
  });
});
