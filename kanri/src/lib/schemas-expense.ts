import { z } from "zod";

export const EXPENSE_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "ordered",
  "completed",
  "paid",
] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  draft: "下書き",
  pending_approval: "承認待ち",
  approved: "承認済",
  rejected: "却下",
  ordered: "発注済",
  completed: "完了",
  paid: "支払済",
};

export const TAX_CATEGORIES = ["taxable", "tax_free", "non_taxable"] as const;
export type TaxCategory = (typeof TAX_CATEGORIES)[number];

export const TAX_CATEGORY_LABELS: Record<TaxCategory, string> = {
  taxable: "課税",
  tax_free: "非課税",
  non_taxable: "不課税",
};

// 支払者(立替の事実)。負担区分とは別軸。
export const EXPENSE_PAYERS = ["company_advance", "owner_direct"] as const;
export type ExpensePayer = (typeof EXPENSE_PAYERS)[number];
export const EXPENSE_PAYER_LABELS: Record<ExpensePayer, string> = {
  company_advance: "管理会社が立替",
  owner_direct: "オーナーが直接支払い",
};

export const ALLOCATION_METHODS = [
  "equal_units",
  "by_floor_area",
  "by_owner_share",
  "custom",
] as const;
export type AllocationMethod = (typeof ALLOCATION_METHODS)[number];

export const ALLOCATION_METHOD_LABELS: Record<AllocationMethod, string> = {
  equal_units: "戸数均等",
  by_floor_area: "床面積比",
  by_owner_share: "オーナー持分比",
  custom: "都度指定",
};

// UUIDの「形」(8-4-4-4-12 の16進)で検証する。Zod の .uuid() は RFC4122 の
// バージョン/バリアントビットまで要求するため、デモの固定ID(c0000000-...)など
// Postgres の uuid 型としては有効だが RFC 非準拠の値を弾いてしまう。
// DB(uuid型)が受け付ける形式に合わせて緩める。
const UUID_SHAPE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const optionalUuid = z
  .string()
  .regex(UUID_SHAPE, "Invalid UUID")
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

export const expenseAllocationInputSchema = z
  .object({
    unit_id: optionalUuid,
    owner_id: optionalUuid,
    owner_amount: z.coerce.number().int().nonnegative().default(0),
    tenant_amount: z.coerce.number().int().nonnegative().default(0),
    company_amount: z.coerce.number().int().nonnegative().default(0),
    amount: z.coerce.number().int().nonnegative(),
    share_ratio: z.coerce.number().nullable().optional(),
    allocation_method: z.enum(ALLOCATION_METHODS).default("custom"),
    notes: z.string().nullable().optional(),
  })
  .refine((a) => !!a.unit_id || !!a.owner_id, {
    message: "unit_id か owner_id のいずれかが必要です",
    path: ["unit_id"],
  })
  .refine((a) => a.owner_amount + a.tenant_amount + a.company_amount === a.amount, {
    message: "内訳合計が amount と一致しません",
    path: ["amount"],
  });

export type ExpenseAllocationInput = z.infer<typeof expenseAllocationInputSchema>;

export const expenseSchema = z
  .object({
    property_id: optionalUuid,
    unit_id: optionalUuid,
    owner_id: optionalUuid,
    payee_id: optionalUuid,
    contract_id: optionalUuid,
    case_id: optionalUuid,
    category: z.enum(["repair", "cleaning", "insurance", "tax", "utility", "other"], {
      message: "カテゴリを選択してください",
    }),
    description: z.string().min(1, "内容は必須です"),
    amount: z.coerce.number().int().positive("金額は0より大きい値を入力してください"),
    expense_date: z.string().min(1, "日付は必須です"),
    owner_amount: z.coerce.number().int().nonnegative().default(0),
    tenant_amount: z.coerce.number().int().nonnegative().default(0),
    company_amount: z.coerce.number().int().nonnegative().default(0),
    status: z.enum(EXPENSE_STATUSES).default("draft"),
    paid_by: z.enum(EXPENSE_PAYERS).default("company_advance"),
    tax_category: z.enum(TAX_CATEGORIES).default("taxable"),
    payment_due_date: z.string().nullable().optional().or(z.literal("").transform(() => null)),
    paid_at: z.string().nullable().optional().or(z.literal("").transform(() => null)),
    notes: z.string().optional().nullable(),
    allocations: z.array(expenseAllocationInputSchema).optional(),
  })
  .refine(
    (d) => d.owner_amount + d.tenant_amount + d.company_amount === d.amount,
    {
      message: "オーナー/入居者/自社の内訳合計が金額と一致しません",
      path: ["amount"],
    },
  )
  .refine((d) => d.tenant_amount === 0 || !!d.contract_id, {
    message: "入居者負担を発生させる場合は契約が必要です",
    path: ["contract_id"],
  });

export type ExpenseFormData = z.infer<typeof expenseSchema>;

export const expenseRejectSchema = z.object({
  rejected_reason: z.string().min(1, "却下理由を入力してください"),
});
export type ExpenseRejectData = z.infer<typeof expenseRejectSchema>;

export const allocationPreviewSchema = z.object({
  property_id: z.string().uuid(),
  amount: z.coerce.number().int().positive(),
  owner_amount: z.coerce.number().int().nonnegative().default(0),
  tenant_amount: z.coerce.number().int().nonnegative().default(0),
  company_amount: z.coerce.number().int().nonnegative().default(0),
  method: z.enum(ALLOCATION_METHODS).default("equal_units"),
});
export type AllocationPreviewInput = z.infer<typeof allocationPreviewSchema>;
