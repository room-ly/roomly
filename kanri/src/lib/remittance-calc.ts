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
  expenses: RemittanceExpense[]; // オーナー負担経費
  carryoverFromPrev?: number; // 前月から繰り越された未収金（控除として作用）
}

export interface RemittanceItem {
  propertyName: string;
  unitNumber: string;
  itemType: "rent" | "expense" | "adjustment" | "carryover";
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
  carryoverFromPrev: number;
  carryoverToNext: number;
  netAmount: number; // 必ず0以上。不足分は carryoverToNext に記録
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

  // 前月繰越（未収金）控除
  const carryoverFromPrev = Math.max(0, Math.round(Number(input.carryoverFromPrev) || 0));
  if (carryoverFromPrev > 0) {
    items.push({
      propertyName: "",
      unitNumber: "",
      itemType: "carryover",
      description: "前月繰越（未収金）",
      amount: -carryoverFromPrev,
    });
  }

  const provisional = totalRent - managementFeeDeducted - expenseDeducted - carryoverFromPrev;
  const netAmount = provisional >= 0 ? provisional : 0;
  const carryoverToNext = provisional >= 0 ? 0 : -provisional;

  return {
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    items,
    totalRent,
    managementFeeDeducted,
    expenseDeducted,
    carryoverFromPrev,
    carryoverToNext,
    netAmount,
  };
}
