// オーナー送金計算ロジック（純粋関数として抽出）

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
  netAmount: number;
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

  const netAmount = totalRent - managementFeeDeducted - expenseDeducted;

  return {
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    items,
    totalRent,
    managementFeeDeducted,
    expenseDeducted,
    netAmount,
  };
}
