import { z } from "zod";
import { stripPhone } from "./phone";

const phoneField = z
  .string()
  .transform((v) => stripPhone(v))
  .pipe(z.string().regex(/^\d*$/, "電話番号の形式が正しくありません"))
  .optional()
  .or(z.literal(""));

const optionalInt = z.coerce
  .number()
  .int()
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalPositiveInt = z.coerce
  .number()
  .int()
  .min(0, "0以上を入力してください")
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalNumber = z.coerce
  .number()
  .min(0, "0以上を入力してください")
  .optional()
  .or(z.literal("").transform(() => undefined));

// 年収（万円単位）。上限は現実的な範囲（10万＝10億円）に設定し、
// 円単位での誤入力（例: 5000000）を弾く
const optionalManYen = z.coerce
  .number()
  .int()
  .min(0, "0以上を入力してください")
  .max(100000, "万円単位で入力してください（例: 500）")
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalString = z.string().optional().or(z.literal(""));
// 駅コード（stations への FK）。未選択の空文字は null に変換して FK 制約違反を防ぐ。
const optionalStationId = z
  .string()
  .optional()
  .or(z.literal("").transform(() => undefined));

// 物件スキーマ
export const propertySchema = z.object({
  // 基本情報
  name: z.string().min(1, "物件名は必須です"),
  name_kana: optionalString,
  property_code: optionalString,
  property_type: z.enum(["apartment", "apart", "house", "commercial", "parking", "land"], {
    message: "物件種別を選択してください",
  }),
  owner_id: z.guid("オーナーを選択してください").optional().or(z.literal("")),
  // 所在地
  postal_code: optionalString,
  address: z.string().min(1, "住所は必須です"),
  prefecture: optionalString,
  city: optionalString,
  town: optionalString,
  building_number: optionalString,
  latitude: z.coerce.number().min(-90).max(90).optional()
    .or(z.literal("").transform(() => undefined)),
  longitude: z.coerce.number().min(-180).max(180).optional()
    .or(z.literal("").transform(() => undefined)),
  // 交通
  // nearest_station* は表示用の駅名テキスト（路線つき）、nearest_station*_id は駅マスタ参照。
  // 駅IDは未選択時に空文字だとFK制約違反になるため null に変換する。
  nearest_station: optionalString,
  nearest_station_id: optionalStationId,
  walk_minutes: optionalPositiveInt,
  nearest_station_2: optionalString,
  nearest_station_2_id: optionalStationId,
  walk_minutes_2: optionalPositiveInt,
  nearest_station_3: optionalString,
  nearest_station_3_id: optionalStationId,
  walk_minutes_3: optionalPositiveInt,
  bus_station: optionalString,
  bus_minutes: optionalPositiveInt,
  // 建物
  structure: optionalString,
  floors: z.coerce.number().int().min(1, "1以上を入力してください").optional()
    .or(z.literal("").transform(() => undefined)),
  underground_floors: optionalPositiveInt,
  built_year: z.coerce
    .number()
    .int()
    .min(1900, "1900年以降を入力してください")
    .max(new Date().getFullYear(), "未来の年は入力できません")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  built_month: z.coerce.number().int().min(1).max(12).optional()
    .or(z.literal("").transform(() => undefined)),
  total_area_sqm: optionalNumber,
  building_area_sqm: optionalNumber,
  land_area_sqm: optionalNumber,
  renovation_year: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional()
    .or(z.literal("").transform(() => undefined)),
  renovation_month: z.coerce.number().int().min(1).max(12).optional()
    .or(z.literal("").transform(() => undefined)),
  // 管理・設備
  management_form: z.enum(["self", "full_management", "partial_management", "sublet"]).optional()
    .or(z.literal("").transform(() => undefined)),
  management_company: optionalString,
  parking: optionalString,
  parking_fee: optionalNumber,
  bicycle_parking: optionalString,
  bike_parking: optionalString,
  common_facilities: z.array(z.string()).optional(),
  // 用途地域・法規
  land_use_zone: optionalString,
  land_rights: z.enum(["ownership", "leasehold", "sublease"]).optional()
    .or(z.literal("").transform(() => undefined)),
  building_coverage_ratio: optionalNumber,
  floor_area_ratio: optionalNumber,
  zoning: optionalString,
  // 管理手数料
  management_fee_rate: z.coerce.number().min(0, "0以上を入力してください").max(100, "100以下を入力してください").optional()
    .or(z.literal("").transform(() => undefined)),
  // 取引
  transaction_type: z.enum(["owner", "agent", "intermediary", "sublet"]).optional()
    .or(z.literal("").transform(() => undefined)),
  // 登記情報
  registered_owner_name: optionalString,
  mortgage_exists: z.union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")]).optional(),
  mortgagee: optionalString,
  mortgage_amount: z.coerce.number().min(0).optional()
    .or(z.literal("").transform(() => undefined)),
  // インフラ
  water_supply: optionalString,
  gas_type: optionalString,
  electricity: optionalString,
  sewage: optionalString,
  septic_tank: z.union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")]).optional(),
  // リスク調査
  asbestos_survey: optionalString,
  earthquake_resistance: optionalString,
  flood_hazard_zone: z.union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")]).optional(),
  landslide_hazard_zone: z.union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")]).optional(),
  tsunami_hazard_zone: z.union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")]).optional(),
  // 自由入力
  notes: optionalString,
  appeal_points: optionalString,
  internal_memo: optionalString,
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
  damage_notes: z.string().optional(),
});

export type UnitFormData = z.infer<typeof unitSchema>;

// 入居者スキーマ
export const tenantSchema = z.object({
  // 基本情報
  name: z.string().min(1, "氏名は必須です"),
  name_kana: optionalString,
  date_of_birth: optionalString,
  gender: optionalString,
  nationality: optionalString,
  phone: phoneField,
  email: z
    .string()
    .email("メールアドレスの形式が正しくありません")
    .optional()
    .or(z.literal("")),
  postal_code: optionalString,
  address: optionalString,
  workplace: optionalString,
  workplace_phone: phoneField,
  annual_income: optionalManYen,
  // 緊急連絡先
  emergency_contact_name: optionalString,
  emergency_contact_phone: phoneField,
  emergency_contact_relation: optionalString,
  // 保証方式: company（保証会社）/ individual（個人連帯保証）/ none（なし）
  guarantee_type: z.enum(["company", "individual", "none"]).optional()
    .or(z.literal("").transform(() => undefined)),
  // 保証会社
  guarantee_company_name: optionalString,
  guarantee_contract_number: optionalString,
  guarantee_fee: optionalPositiveInt,
  // 保証人（個人連帯保証）
  guarantor_name: optionalString,
  guarantor_name_kana: optionalString,
  guarantor_date_of_birth: optionalString,
  guarantor_phone: phoneField,
  guarantor_address: optionalString,
  guarantor_workplace: optionalString,
  guarantor_workplace_phone: phoneField,
  guarantor_annual_income: optionalManYen,
  guarantor_relation: optionalString,
  // 備考
  notes: optionalString,
});

export type TenantFormData = z.infer<typeof tenantSchema>;

// 契約スキーマ
export const contractSchema = z
  .object({
    unit_id: z.guid("部屋を選択してください"),
    tenant_id: z.guid("入居者を選択してください"),
    contract_type: z.enum(["fixed", "ordinary"], {
      message: "契約種別を選択してください",
    }),
    start_date: z.string().min(1, "契約開始日は必須です"),
    end_date: z.string().optional().or(z.literal("")),
    move_out_date: z.string().optional().or(z.literal("")),
    rent: z.coerce.number().positive("賃料は0より大きい値を入力してください"),
    management_fee: z.coerce
      .number()
      .min(0, "管理費は0以上を入力してください"),
    deposit: z.coerce.number().min(0, "敷金は0以上を入力してください").optional()
      .or(z.literal("").transform(() => undefined)),
    key_money: z.coerce.number().min(0, "礼金は0以上を入力してください").optional()
      .or(z.literal("").transform(() => undefined)),
    renewal_fee: z.coerce.number().min(0, "更新料は0以上を入力してください").optional()
      .or(z.literal("").transform(() => undefined)),
    signed_date: optionalString,
    important_explanation_date: optionalString,
    payment_method: optionalString,
    payment_due_day: optionalPositiveInt,
    guarantor_name: optionalString,
    guarantor_phone: phoneField,
    insurance_company: optionalString,
    brokerage_fee: z.coerce.number().min(0).optional()
      .or(z.literal("").transform(() => undefined)),
    special_terms: optionalString,
    status: z.enum(["active", "expired", "terminated", "pending"], {
      message: "状態を選択してください",
    }),
    notes: optionalString,
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
    .positive("金額は0より大きい値を入力してください"),
  payment_method: z.enum(["transfer", "card", "cash", "debit", "refund"], {
    message: "支払方法を選択してください",
  }),
  payment_date: z.string().min(1, "日付は必須です"),
  note: z.string().optional(),
});

export type RentPaymentFormData = z.infer<typeof rentPaymentSchema>;

// 修繕依頼スキーマ
export const maintenanceSchema = z.object({
  property_id: z.guid("物件を選択してください"),
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
    ["move_out", "maintenance", "complaint", "other"],
    {
      message: "種別を選択してください",
    }
  ),
  move_out_date: z.string().optional().or(z.literal("")),
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
  phone: phoneField,
  email: z.string().email("メールアドレスの形式が正しくありません").optional().or(z.literal("")),
  postal_code: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  bank_name: z.string().optional().or(z.literal("")),
  bank_code: z.string().max(4).optional().or(z.literal("")),
  bank_branch: z.string().optional().or(z.literal("")),
  bank_branch_code: z.string().max(3).optional().or(z.literal("")),
  bank_account_type: z.string().optional().or(z.literal("")),
  bank_account_number: z.string().max(7).optional().or(z.literal("")),
  bank_account_holder: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type OwnerFormData = z.infer<typeof ownerSchema>;
