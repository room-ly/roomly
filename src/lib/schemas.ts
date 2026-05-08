import { z } from "zod";

// 物件スキーマ
export const propertySchema = z.object({
  name: z.string().min(1, "物件名は必須です"),
  address: z.string().min(1, "住所は必須です"),
  property_type: z.enum(["apartment", "house", "commercial", "parking"], {
    message: "物件種別を選択してください",
  }),
  owner_id: z.string().uuid("オーナーを選択してください").optional().or(z.literal("")),
  structure: z.string().optional(),
  built_year: z.coerce
    .number()
    .int()
    .min(1900, "1900年以降を入力してください")
    .max(new Date().getFullYear(), "未来の年は入力できません")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  floors: z.coerce
    .number()
    .int()
    .min(1, "1以上を入力してください")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  nearest_station: z.string().optional(),
  walk_minutes: z.coerce
    .number()
    .int()
    .min(0, "0以上を入力してください")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

// 部屋スキーマ
export const unitSchema = z.object({
  unit_number: z.string().min(1, "部屋番号は必須です"),
  floor: z.coerce
    .number()
    .int()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  layout: z.string().optional(),
  area_sqm: z.coerce
    .number()
    .min(0, "0以上を入力してください")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  rent: z.coerce.number().positive("賃料は0より大きい値を入力してください"),
  management_fee: z.coerce
    .number()
    .min(0, "管理費は0以上を入力してください"),
  status: z.enum(["vacant", "occupied", "reserved", "maintenance"], {
    message: "状態を選択してください",
  }),
});

export type UnitFormData = z.infer<typeof unitSchema>;

// 入居者スキーマ
export const tenantSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  name_kana: z.string().optional(),
  phone: z
    .string()
    .regex(/^[\d\-+()]*$/, "電話番号の形式が正しくありません")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("メールアドレスの形式が正しくありません")
    .optional()
    .or(z.literal("")),
  workplace: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z
    .string()
    .regex(/^[\d\-+()]*$/, "電話番号の形式が正しくありません")
    .optional()
    .or(z.literal("")),
});

export type TenantFormData = z.infer<typeof tenantSchema>;

// 契約スキーマ
export const contractSchema = z
  .object({
    unit_id: z.string().uuid("部屋を選択してください"),
    tenant_id: z.string().uuid("入居者を選択してください"),
    contract_type: z.enum(["fixed", "ordinary"], {
      message: "契約種別を選択してください",
    }),
    start_date: z.string().min(1, "契約開始日は必須です"),
    end_date: z.string().optional().or(z.literal("")),
    rent: z.coerce.number().positive("賃料は0より大きい値を入力してください"),
    management_fee: z.coerce
      .number()
      .min(0, "管理費は0以上を入力してください"),
    status: z.enum(["active", "expired", "terminated", "pending"], {
      message: "状態を選択してください",
    }),
  })
  .refine(
    (data) => {
      if (data.end_date && data.start_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: "契約終了日は開始日以降にしてください",
      path: ["end_date"],
    }
  );

export type ContractFormData = z.infer<typeof contractSchema>;

// 家賃請求スキーマ
export const rentBillingSchema = z.object({
  total_amount: z.coerce
    .number()
    .positive("請求額は0より大きい値を入力してください"),
  billing_month: z.string().min(1, "対象月は必須です"),
  due_date: z.string().min(1, "支払期限は必須です"),
  status: z.enum(["unpaid", "partial", "paid", "overdue"], {
    message: "状態を選択してください",
  }),
});

export type RentBillingFormData = z.infer<typeof rentBillingSchema>;

// 入金登録スキーマ
export const rentPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive("入金額は0より大きい値を入力してください"),
  payment_method: z.enum(["transfer", "card", "cash", "debit"], {
    message: "支払方法を選択してください",
  }),
  payment_date: z.string().min(1, "入金日は必須です"),
  note: z.string().optional(),
});

export type RentPaymentFormData = z.infer<typeof rentPaymentSchema>;

// 修繕依頼スキーマ
export const maintenanceSchema = z.object({
  property_id: z.string().uuid("物件を選択してください"),
  unit_id: z.string().optional().or(z.literal("")),
  title: z.string().min(1, "件名は必須です"),
  description: z.string().optional(),
  category: z.string().min(1, "カテゴリは必須です"),
  priority: z.enum(["low", "normal", "high", "urgent"], {
    message: "優先度を選択してください",
  }),
  status: z
    .enum(["open", "in_progress", "waiting_parts", "completed", "cancelled"])
    .default("open"),
  vendor_name: z.string().optional(),
  estimated_cost: z.coerce
    .number()
    .min(0, "0以上を入力してください")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

// 問い合わせスキーマ
export const inquirySchema = z.object({
  property_id: z.string().optional().or(z.literal("")),
  unit_id: z.string().optional().or(z.literal("")),
  tenant_id: z.string().optional().or(z.literal("")),
  inquiry_type: z.enum(
    ["general", "complaint", "noise", "facility", "move_out", "other"],
    {
      message: "種別を選択してください",
    }
  ),
  title: z.string().min(1, "件名は必須です"),
  description: z.string().optional(),
  status: z
    .enum(["open", "in_progress", "resolved", "closed"])
    .default("open"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export type InquiryFormData = z.infer<typeof inquirySchema>;

// オーナースキーマ
export const ownerSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("メールアドレスの形式が正しくありません").optional().or(z.literal("")),
  postal_code: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  bank_name: z.string().optional().or(z.literal("")),
  bank_branch: z.string().optional().or(z.literal("")),
  bank_account_type: z.string().optional().or(z.literal("")),
  bank_account_number: z.string().optional().or(z.literal("")),
  bank_account_holder: z.string().optional().or(z.literal("")),
  management_fee_rate: z.coerce.number().min(0, "0以上を入力してください").max(100, "100以下を入力してください"),
  notes: z.string().optional().or(z.literal("")),
});

export type OwnerFormData = z.infer<typeof ownerSchema>;
