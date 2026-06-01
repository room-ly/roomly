// seed-data.ts の TypeScript 定義から、デモ会社リセット用のSQL文字列を生成する。
// 出力は単一トランザクションとして PostgREST 経由で実行する想定。

import {
  SEED_OWNERS, SEED_PROPERTIES, SEED_UNITS, SEED_TENANTS, SEED_CONTRACTS,
  SEED_CASES, SEED_EXPENSES,
  BILLING_CONTRACTS_ASC, MISS_TOTAL, MISS_OVERDUE, PAYMENT_BANKS, PAYMENT_HOLDERS,
} from "./seed-data";

// SQL リテラル化（最低限のエスケープ。シングルクォートのみ）
function lit(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return v.toString();
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  // 文字列・日付
  const s = String(v).replace(/'/g, "''");
  return `'${s}'`;
}

// オブジェクトの (keys, values) を取り出す
function pairs(o: Record<string, unknown>): { keys: string[]; values: unknown[] } {
  const keys = Object.keys(o);
  return { keys, values: keys.map((k) => o[k]) };
}

// INSERT 文（同テーブル複数行を1文に集約）
function buildInsert(table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const allKeys = Array.from(
    new Set(rows.flatMap((r) => Object.keys(r))),
  );
  const colList = allKeys.join(", ");
  const valueLines = rows.map((r) => {
    const vs = allKeys.map((k) => lit(r[k]));
    return `(${vs.join(", ")})`;
  });
  return `INSERT INTO public.${table} (${colList}) VALUES\n  ${valueLines.join(",\n  ")};`;
}

export function generateResetSql(demoCompanyId: string): string {
  const cid = lit(demoCompanyId);

  // ============================================
  // 1) 削除（依存関係順）
  // ============================================
  const deletes = `
DELETE FROM public.documents WHERE company_id = ${cid};
DELETE FROM public.case_logs WHERE case_id IN (SELECT id FROM public.cases WHERE company_id = ${cid});
DELETE FROM public.cases WHERE company_id = ${cid};
DELETE FROM public.owner_remittance_items WHERE remittance_id IN (SELECT id FROM public.owner_remittances WHERE company_id = ${cid});
DELETE FROM public.owner_remittances WHERE company_id = ${cid};
DELETE FROM public.rent_payments WHERE company_id = ${cid};
DELETE FROM public.rent_billings WHERE company_id = ${cid};
DELETE FROM public.expenses WHERE company_id = ${cid};
DELETE FROM public.contracts WHERE company_id = ${cid};
DELETE FROM public.tenants WHERE company_id = ${cid};
DELETE FROM public.vacancies WHERE company_id = ${cid};
DELETE FROM public.units WHERE property_id IN (SELECT id FROM public.properties WHERE company_id = ${cid});
DELETE FROM public.properties WHERE company_id = ${cid};
DELETE FROM public.owners WHERE company_id = ${cid};
`.trim();

  // ============================================
  // 2) 固定シード（オーナー・物件・区画・入居者・契約）
  // ============================================
  const withCompanyId = <T extends Record<string, unknown>>(rows: T[]): (T & { company_id: string })[] =>
    rows.map((r) => ({ company_id: demoCompanyId, ...r }));

  const ownersSql = buildInsert("owners", withCompanyId(SEED_OWNERS as unknown as Record<string, unknown>[]));
  const propertiesSql = buildInsert("properties", withCompanyId(SEED_PROPERTIES as unknown as Record<string, unknown>[]));
  const unitsSql = buildInsert("units", withCompanyId(SEED_UNITS as unknown as Record<string, unknown>[]));
  const tenantsSql = buildInsert("tenants", withCompanyId(SEED_TENANTS as unknown as Record<string, unknown>[]));
  const contractsSql = buildInsert("contracts", withCompanyId(SEED_CONTRACTS as unknown as Record<string, unknown>[]));

  // ============================================
  // 3) 対応案件（日付は CURRENT_DATE 基準で動的）
  // ============================================
  const casesRows = SEED_CASES.map((c) => {
    const { reportedDaysAgo, completedDaysAgo, createdDaysAgo, ...rest } = c;
    // 日付カラムは SQL 式として埋め込みたいので、後でプレースホルダ置換する
    // created_at は全行で必須（NOT NULL）。createdDaysAgo 指定時はその過去日時、
    // 未指定時は NOW() を明示的に入れる（DEFAULT に頼らない）
    const ts = createdDaysAgo !== undefined
      ? `__SQL__NOW() - INTERVAL '${createdDaysAgo} days'`
      : `__SQL__NOW()`;
    return {
      ...rest,
      company_id: demoCompanyId,
      reported_date: `__SQL__CURRENT_DATE - ${reportedDaysAgo}`,
      ...(completedDaysAgo !== undefined ? { completed_date: `__SQL__CURRENT_DATE - ${completedDaysAgo}` } : {}),
      created_at: ts,
      updated_at: ts,
    };
  });
  let casesSql = buildInsert("cases", casesRows as Record<string, unknown>[]);
  // プレースホルダ '__SQL__...' を生のSQL式に戻す（シングルクォートを取り除く）
  casesSql = casesSql.replace(/'__SQL__([^']+)'/g, "$1");

  // ============================================
  // 4) 経費（日付動的）
  // ============================================
  const expensesRows = SEED_EXPENSES.map((e) => {
    const { expenseDaysAgo, ...rest } = e;
    return {
      ...rest,
      company_id: demoCompanyId,
      expense_date: `__SQL__CURRENT_DATE - ${expenseDaysAgo}`,
    };
  });
  let expensesSql = buildInsert("expenses", expensesRows as Record<string, unknown>[]);
  expensesSql = expensesSql.replace(/'__SQL__([^']+)'/g, "$1");

  // ============================================
  // 5) 家賃請求 + 入金 (直近6ヶ月分を動的生成)
  // ============================================
  // billing_id は SQL 側で gen_random_uuid() を使うため、CTEで生成 → INSERT 連鎖
  const billingStatements: string[] = [];
  for (let idx = 0; idx < 6; idx++) {
    // idx=0 が5ヶ月前、idx=5 が当月
    const monthExpr = `(date_trunc('month', CURRENT_DATE) - INTERVAL '${5 - idx} months')::date`;
    const dueExpr = `(date_trunc('month', CURRENT_DATE) - INTERVAL '${5 - idx} months' + INTERVAL '26 days')::date`;
    for (let i = 0; i < BILLING_CONTRACTS_ASC.length; i++) {
      const c = BILLING_CONTRACTS_ASC[i];
      const total = c.rent + c.mgmt;
      let status: string;
      if (i < MISS_OVERDUE[idx]) status = "overdue";
      else if (i < MISS_TOTAL[idx]) status = "unpaid";
      else status = "paid";

      const billingIdVar = `gen_random_uuid()`;
      // 共通CTE: 1行ごとに insert を生成し、必要なら入金を続ける
      const insertBilling = `
WITH new_billing AS (
  INSERT INTO public.rent_billings (id, company_id, contract_id, billing_month, rent, management_fee, other_amount, total_amount, due_date, status)
  VALUES (${billingIdVar}, ${cid}, ${lit(c.id)}, ${monthExpr}, ${c.rent}, ${c.mgmt}, 0, ${total}, ${dueExpr}, ${lit(status)})
  RETURNING id
)`.trim();

      if (status === "paid") {
        const bankIdx = (i + idx) % PAYMENT_BANKS.length;
        const [bankName, branch] = PAYMENT_BANKS[bankIdx];
        const holder = PAYMENT_HOLDERS[i];
        const noteText = `振込元: ${bankName} ${branch} 普通 ${holder}`;
        const paidExpr = `(date_trunc('month', CURRENT_DATE) - INTERVAL '${5 - idx} months' + INTERVAL '25 days' + INTERVAL '${i % 4} days')::date`;
        billingStatements.push(`${insertBilling}
INSERT INTO public.rent_payments (company_id, billing_id, amount, payment_date, payment_method, notes)
SELECT ${cid}, id, ${total}, ${paidExpr}, 'transfer', ${lit(noteText)} FROM new_billing;`);
      } else {
        billingStatements.push(`${insertBilling}
SELECT 1 FROM new_billing;`);
      }
    }
  }
  const billingsSql = billingStatements.join("\n\n");

  // ============================================
  // 6) 退去予定: f...006 の move_out_date を当月末に
  // ============================================
  const moveOutSql = `
UPDATE public.contracts
   SET move_out_date = (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date
 WHERE id = 'f0000000-0000-0000-0000-000000000006';
`.trim();

  // ============================================
  // すべてを単一のトランザクションとして連結
  // ============================================
  return [
    "BEGIN;",
    deletes,
    ownersSql,
    propertiesSql,
    unitsSql,
    tenantsSql,
    contractsSql,
    casesSql,
    expensesSql,
    billingsSql,
    moveOutSql,
    "COMMIT;",
  ].join("\n\n");
}
