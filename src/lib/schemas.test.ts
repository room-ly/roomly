import { describe, it, expect } from "vitest";
import {
  propertySchema,
  unitSchema,
  tenantSchema,
  contractSchema,
  rentBillingSchema,
  maintenanceSchema,
  inquirySchema,
  rentPaymentSchema,
} from "./schemas";

describe("propertySchema", () => {
  it("有効なデータを受け入れる", () => {
    const result = propertySchema.safeParse({
      name: "テストマンション",
      address: "東京都新宿区1-1-1",
      property_type: "apartment",
    });
    expect(result.success).toBe(true);
  });

  it("名前が空の場合エラー", () => {
    const result = propertySchema.safeParse({
      name: "",
      address: "東京都新宿区1-1-1",
      property_type: "apartment",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("物件名は必須です");
    }
  });

  it("住所が空の場合エラー", () => {
    const result = propertySchema.safeParse({
      name: "テスト",
      address: "",
      property_type: "apartment",
    });
    expect(result.success).toBe(false);
  });

  it("無効な物件種別でエラー", () => {
    const result = propertySchema.safeParse({
      name: "テスト",
      address: "東京都",
      property_type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("全フィールド入力を受け入れる", () => {
    const result = propertySchema.safeParse({
      name: "テストマンション",
      address: "東京都新宿区1-1-1",
      property_type: "apartment",
      owner_id: "550e8400-e29b-41d4-a716-446655440000",
      structure: "RC造",
      built_year: 2020,
      floors: 5,
      nearest_station: "新宿駅",
      walk_minutes: 10,
    });
    expect(result.success).toBe(true);
  });
});

describe("unitSchema", () => {
  it("有効なデータを受け入れる", () => {
    const result = unitSchema.safeParse({
      unit_number: "101",
      rent: 80000,
      management_fee: 5000,
      status: "vacant",
    });
    expect(result.success).toBe(true);
  });

  it("部屋番号が空の場合エラー", () => {
    const result = unitSchema.safeParse({
      unit_number: "",
      rent: 80000,
      management_fee: 5000,
      status: "vacant",
    });
    expect(result.success).toBe(false);
  });

  it("賃料が0以下でエラー", () => {
    const result = unitSchema.safeParse({
      unit_number: "101",
      rent: 0,
      management_fee: 5000,
      status: "vacant",
    });
    expect(result.success).toBe(false);
  });

  it("管理費が負の値でエラー", () => {
    const result = unitSchema.safeParse({
      unit_number: "101",
      rent: 80000,
      management_fee: -1,
      status: "vacant",
    });
    expect(result.success).toBe(false);
  });
});

describe("tenantSchema", () => {
  it("名前のみで有効", () => {
    const result = tenantSchema.safeParse({ name: "山田太郎" });
    expect(result.success).toBe(true);
  });

  it("名前が空でエラー", () => {
    const result = tenantSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("有効なメールを受け入れる", () => {
    const result = tenantSchema.safeParse({
      name: "山田太郎",
      email: "yamada@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("無効なメールでエラー", () => {
    const result = tenantSchema.safeParse({
      name: "山田太郎",
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
  });

  it("空のメールは許容", () => {
    const result = tenantSchema.safeParse({
      name: "山田太郎",
      email: "",
    });
    expect(result.success).toBe(true);
  });

  it("有効な電話番号を受け入れる", () => {
    const result = tenantSchema.safeParse({
      name: "山田太郎",
      phone: "03-1234-5678",
    });
    expect(result.success).toBe(true);
  });

  it("無効な電話番号でエラー", () => {
    const result = tenantSchema.safeParse({
      name: "山田太郎",
      phone: "abc-defg",
    });
    expect(result.success).toBe(false);
  });
});

describe("contractSchema", () => {
  const validContract = {
    unit_id: "550e8400-e29b-41d4-a716-446655440000",
    tenant_id: "550e8400-e29b-41d4-a716-446655440001",
    contract_type: "fixed" as const,
    start_date: "2026-01-01",
    rent: 80000,
    management_fee: 5000,
    status: "active" as const,
  };

  it("有効なデータを受け入れる", () => {
    const result = contractSchema.safeParse(validContract);
    expect(result.success).toBe(true);
  });

  it("開始日が必須", () => {
    const result = contractSchema.safeParse({
      ...validContract,
      start_date: "",
    });
    expect(result.success).toBe(false);
  });

  it("終了日が開始日より前でエラー", () => {
    const result = contractSchema.safeParse({
      ...validContract,
      start_date: "2026-06-01",
      end_date: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("終了日が開始日以降なら有効", () => {
    const result = contractSchema.safeParse({
      ...validContract,
      start_date: "2026-01-01",
      end_date: "2028-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("賃料が0でエラー", () => {
    const result = contractSchema.safeParse({
      ...validContract,
      rent: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("rentBillingSchema", () => {
  it("有効なデータを受け入れる", () => {
    const result = rentBillingSchema.safeParse({
      total_amount: 85000,
      billing_month: "2026-03",
      due_date: "2026-03-25",
      status: "unpaid",
    });
    expect(result.success).toBe(true);
  });

  it("請求額が0以下でエラー", () => {
    const result = rentBillingSchema.safeParse({
      total_amount: 0,
      billing_month: "2026-03",
      due_date: "2026-03-25",
      status: "unpaid",
    });
    expect(result.success).toBe(false);
  });
});

describe("rentPaymentSchema", () => {
  it("有効なデータを受け入れる", () => {
    const result = rentPaymentSchema.safeParse({
      amount: 80000,
      payment_method: "transfer",
      payment_date: "2026-03-25",
    });
    expect(result.success).toBe(true);
  });

  it("入金額が0以下でエラー", () => {
    const result = rentPaymentSchema.safeParse({
      amount: 0,
      payment_method: "transfer",
      payment_date: "2026-03-25",
    });
    expect(result.success).toBe(false);
  });
});

describe("maintenanceSchema", () => {
  it("有効なデータを受け入れる", () => {
    const result = maintenanceSchema.safeParse({
      property_id: "550e8400-e29b-41d4-a716-446655440000",
      title: "水漏れ修理",
      category: "plumbing",
      priority: "high",
    });
    expect(result.success).toBe(true);
  });

  it("件名が空でエラー", () => {
    const result = maintenanceSchema.safeParse({
      property_id: "550e8400-e29b-41d4-a716-446655440000",
      title: "",
      category: "plumbing",
      priority: "high",
    });
    expect(result.success).toBe(false);
  });

  it("カテゴリが空でエラー", () => {
    const result = maintenanceSchema.safeParse({
      property_id: "550e8400-e29b-41d4-a716-446655440000",
      title: "水漏れ修理",
      category: "",
      priority: "high",
    });
    expect(result.success).toBe(false);
  });
});

describe("inquirySchema", () => {
  it("有効なデータを受け入れる", () => {
    const result = inquirySchema.safeParse({
      inquiry_type: "complaint",
      title: "騒音の苦情",
      priority: "high",
    });
    expect(result.success).toBe(true);
  });

  it("件名が空でエラー", () => {
    const result = inquirySchema.safeParse({
      inquiry_type: "other",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("デフォルト値が設定される", () => {
    const result = inquirySchema.safeParse({
      inquiry_type: "other",
      title: "テスト問い合わせ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("open");
      expect(result.data.priority).toBe("normal");
    }
  });
});
