import { z } from "zod";

export const payeeSchema = z.object({
  name: z.string().min(1, "取引先名は必須です"),
  name_kana: z.string().optional().or(z.literal("")),
  category: z.enum(["repair", "cleaning", "insurance", "other"], {
    message: "カテゴリを選択してください",
  }),
  phone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  bank_code: z.string().max(4).optional().or(z.literal("")),
  bank_name: z.string().optional().or(z.literal("")),
  branch_code: z.string().max(3).optional().or(z.literal("")),
  branch_name: z.string().optional().or(z.literal("")),
  account_type: z.string().optional().or(z.literal("")),
  account_number: z.string().max(7).optional().or(z.literal("")),
  account_holder_kana: z.string().optional().or(z.literal("")),
});

export type PayeeFormData = z.infer<typeof payeeSchema>;
