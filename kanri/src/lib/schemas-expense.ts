import { z } from "zod";

export const expenseSchema = z.object({
  property_id: z.string().optional().or(z.literal("")),
  unit_id: z.string().optional().or(z.literal("")),
  owner_id: z.string().optional().or(z.literal("")),
  category: z.enum(["repair", "cleaning", "insurance", "tax", "utility", "other"], {
    message: "カテゴリを選択してください",
  }),
  description: z.string().min(1, "内容は必須です"),
  amount: z.coerce.number().positive("金額は0より大きい値を入力してください"),
  expense_date: z.string().min(1, "日付は必須です"),
  is_owner_charge: z.boolean().default(false),
  notes: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
