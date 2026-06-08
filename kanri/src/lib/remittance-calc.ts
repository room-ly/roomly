// オーナー送金計算ロジック（純粋関数として抽出）

// 自主管理は管理会社への委託手数料が発生しないため、手数料率を実効0%にする。
// それ以外の形態（全部委託・一部委託・サブリース・未設定）は登録された手数料率をそのまま使う。
export function effectiveFeeRate(
  feeRate: number | null | undefined,
  managementForm: string | null | undefined
): number {
  if (managementForm === "self") return 0;
  return Number(feeRate) || 0;
}

// 管理手数料（税抜）に対する消費税額（外税）を計算する。
// 課税事業者でない会社は0。税率はデフォルト10%。1円未満は四捨五入。
export function calcManagementFeeTax(input: {
  feeExclTax: number;
  isTaxInvoiceIssuer: boolean | null | undefined;
  taxRate: number | null | undefined; // 0.10 = 10%
}): number {
  if (!input.isTaxInvoiceIssuer) return 0;
  if (input.feeExclTax <= 0) return 0;
  const rate = Number(input.taxRate);
  const effectiveRate = Number.isFinite(rate) && rate > 0 ? rate : 0.1;
  return Math.round(input.feeExclTax * effectiveRate);
}

// 物件の管理手数料を計算する。
// fee_type='rate' なら 家賃 × % を四捨五入、fee_type='fixed' なら固定額（円）をそのまま返す。
// 固定額方式でも家賃が0円のとき（入金なし）は手数料も0にする。
// 自主管理時は方式に関わらず0。
export function calcPropertyManagementFee(input: {
  rent: number;
  feeType: string | null | undefined;
  feeRate: number | null | undefined;
  feeAmount: number | null | undefined;
  managementForm: string | null | undefined;
}): number {
  if (input.managementForm === "self") return 0;
  if (input.rent <= 0) return 0;
  if (input.feeType === "fixed") {
    return Math.max(0, Math.floor(Number(input.feeAmount) || 0));
  }
  const rate = Number(input.feeRate) || 0;
  return Math.round(input.rent * (rate / 100));
}

export interface RemittanceProperty {
  propertyId: string;
  propertyName: string;
  units: RemittanceUnit[];
}

export interface RemittanceUnit {
  unitId: string;
  unitNumber: string;
  rent: number;
  managementFee: number;
  isPaid: boolean; // 当月入金済みか
}

export interface RemittanceExpense {
  description: string;
  amount: number;
  propertyId?: string;
  unitId?: string;
}

export interface RemittanceCalcInput {
  ownerId: string;
  ownerName: string;
  managementFeeRate: number; // パーセント（例: 5.0）
  properties: RemittanceProperty[];
  expenses: RemittanceExpense[]; // オーナー負担費用
}

export interface RemittanceItem {
  propertyName: string;
  unitNumber: string;
  itemType: "rent" | "expense" | "adjustment";
  description: string;
  amount: number; // 正: 収入、負: 控除
}

export interface RemittanceResult {
  ownerId: string;
  ownerName: string;
  items: RemittanceItem[];
  totalRent: number;
  managementFeeDeducted: number;
  expenseDeducted: number;
  netAmount: number; // 必ず0以上
  ownerBillAmount: number; // 費用が家賃収入を超過した不足分。オーナーへ請求する額
}

// 月次送金計算
export function calcRemittance(input: RemittanceCalcInput): RemittanceResult {
  const items: RemittanceItem[] = [];
  let totalRent = 0;

  // 各物件の入金済み家賃を集計
  for (const prop of input.properties) {
    for (const unit of prop.units) {
      if (unit.isPaid) {
        const rentAmount = unit.rent + unit.managementFee;
        totalRent += rentAmount;
        items.push({
          propertyName: prop.propertyName,
          unitNumber: unit.unitNumber,
          itemType: "rent",
          description: `家賃（${unit.unitNumber}号室）`,
          amount: rentAmount,
        });
      }
    }
  }

  // 管理手数料計算
  const managementFeeDeducted = Math.round(
    totalRent * (input.managementFeeRate / 100)
  );

  if (managementFeeDeducted > 0) {
    items.push({
      propertyName: "",
      unitNumber: "",
      itemType: "adjustment",
      description: `管理手数料（${input.managementFeeRate}%）`,
      amount: -managementFeeDeducted,
    });
  }

  // 経費控除
  let expenseDeducted = 0;
  for (const expense of input.expenses) {
    expenseDeducted += expense.amount;
    const prop = input.properties.find((p) => p.propertyId === expense.propertyId);
    items.push({
      propertyName: prop?.propertyName ?? "",
      unitNumber: "",
      itemType: "expense",
      description: expense.description,
      amount: -expense.amount,
    });
  }

  // 費用が家賃収入を超過した不足分は翌月繰越にせず、当月のオーナー請求とする。
  const provisional = totalRent - managementFeeDeducted - expenseDeducted;
  const netAmount = provisional >= 0 ? provisional : 0;
  const ownerBillAmount = provisional >= 0 ? 0 : -provisional;

  return {
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    items,
    totalRent,
    managementFeeDeducted,
    expenseDeducted,
    netAmount,
    ownerBillAmount,
  };
}

// ============================================================
// DB行ベースの送金計算（calc プレビュー / 送金生成 POST で共用する単一の真実）
//   - 家賃は rent_payments の実入金額ベース（partial 入金も入金分だけ計上）
//   - 経費は「未精算（remittance_id IS NULL）の owner_amount>0」を物件で絞って拾う
//   - 管理手数料は物件単位、外税で消費税額を別途算出
//   - 明細行(items)を生成して保存できる形で返す
// ============================================================

export interface RemitDbUnit {
  id: string;
  unit_number: string;
}

export interface RemitDbProperty {
  id: string;
  name: string;
  management_fee_type: string | null;
  management_fee_rate: number | null;
  management_fee_amount: number | null;
  management_form: string | null;
  units: RemitDbUnit[];
}

// rent_billings 行（contract 経由で unit_id を持つ）+ その billing への当月実入金合計
export interface RemitDbBilling {
  id: string;
  unit_id: string | null;
  paid_amount: number; // この billing に対する実入金合計（partial 対応）
}

export interface RemitDbExpense {
  id: string;
  description: string;
  owner_amount: number;
  property_id: string | null;
  unit_id: string | null;
}

export interface RemitItemRow {
  unit_id: string | null;
  item_type: "rent" | "management_fee" | "management_fee_tax" | "expense" | "adjustment";
  description: string;
  amount: number; // 正: 収入、負: 控除
}

export interface BuildRemittanceInput {
  properties: RemitDbProperty[];
  billings: RemitDbBilling[];   // owner の全 billing（当月・実入金額付き）
  expenses: RemitDbExpense[];   // owner の未精算 owner_amount>0 経費
  isTaxInvoiceIssuer: boolean | null | undefined;
  taxRate: number | null | undefined;
  manualNetAmount?: number | null;
}

export interface BuildRemittanceResult {
  totalRent: number;
  managementFeeDeducted: number;   // 税抜
  managementFeeTax: number;        // 外税
  expenseDeducted: number;
  netAmount: number;               // 必ず0以上
  ownerBillAmount: number;         // 不足分（オーナー請求）
  isManual: boolean;
  items: RemitItemRow[];
  settledExpenseIds: string[];     // この送金で精算した経費ID
}

export function buildRemittance(input: BuildRemittanceInput): BuildRemittanceResult {
  const items: RemitItemRow[] = [];
  let totalRent = 0;
  let managementFeeDeducted = 0;
  let managementFeeTax = 0;

  const billingByUnit = new Map<string, number>();
  for (const b of input.billings) {
    if (!b.unit_id) continue;
    billingByUnit.set(b.unit_id, (billingByUnit.get(b.unit_id) ?? 0) + Number(b.paid_amount || 0));
  }

  for (const p of input.properties) {
    const unitIds = p.units.map((u) => u.id);
    let pRent = 0;
    for (const u of p.units) {
      const paid = billingByUnit.get(u.id) ?? 0;
      if (paid > 0) {
        pRent += paid;
        items.push({
          unit_id: u.id,
          item_type: "rent",
          description: `家賃入金（${u.unit_number}）`,
          amount: paid,
        });
      }
    }
    void unitIds;
    const pFee = calcPropertyManagementFee({
      rent: pRent,
      feeType: p.management_fee_type,
      feeRate: p.management_fee_rate,
      feeAmount: p.management_fee_amount,
      managementForm: p.management_form,
    });
    const pTax = calcManagementFeeTax({
      feeExclTax: pFee,
      isTaxInvoiceIssuer: input.isTaxInvoiceIssuer,
      taxRate: input.taxRate,
    });
    totalRent += pRent;
    managementFeeDeducted += pFee;
    managementFeeTax += pTax;
    if (pFee > 0) {
      items.push({
        unit_id: null,
        item_type: "management_fee",
        description: `管理手数料（${p.name}）`,
        amount: -pFee,
      });
      if (pTax > 0) {
        items.push({
          unit_id: null,
          item_type: "management_fee_tax",
          description: `管理手数料 消費税（${p.name}）`,
          amount: -pTax,
        });
      }
    }
  }

  // 未精算のオーナー負担経費（物件レンジでなく remittance_id IS NULL で拾う）
  let expenseDeducted = 0;
  const settledExpenseIds: string[] = [];
  for (const e of input.expenses) {
    const amt = Number(e.owner_amount || 0);
    if (amt <= 0) continue;
    expenseDeducted += amt;
    settledExpenseIds.push(e.id);
    items.push({
      unit_id: e.unit_id,
      item_type: "expense",
      description: e.description,
      amount: -amt,
    });
  }

  const idealNet = totalRent - managementFeeDeducted - managementFeeTax - expenseDeducted;
  const isManual = input.manualNetAmount !== undefined && input.manualNetAmount !== null;
  const autoNet = idealNet >= 0 ? idealNet : 0;
  const netAmount = isManual ? Math.max(0, Number(input.manualNetAmount)) : autoNet;
  // オーナー請求額: 不足分 + 手動で送金を減らした差額
  const ownerBillAmount = Math.max(0, -idealNet) + Math.max(0, (idealNet >= 0 ? idealNet : 0) - netAmount);

  return {
    totalRent,
    managementFeeDeducted,
    managementFeeTax,
    expenseDeducted,
    netAmount,
    ownerBillAmount,
    isManual,
    items,
    settledExpenseIds,
  };
}
