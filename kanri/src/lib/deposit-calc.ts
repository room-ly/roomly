export type DepositTx = {
  transaction_type: "initial_deposit" | "charge" | "refund" | "additional_billing" | string;
  amount: number | string;
};

export type DepositSummary = {
  initial: number;
  charged: number;
  refunded: number;
  additionalBilled: number;
  balance: number;
};

/**
 * 敷金残高を計算する。
 * - initial: 契約上の敷金（contracts.deposit）。トランザクションに 'initial_deposit' があれば加算
 * - charged: 'charge'（退去清掃等で敷金を取り崩した分）
 * - refunded: 'refund'（退去時の返金）
 * - additionalBilled: 'additional_billing'（敷金不足分を入居者に追加請求した分。残高計算には含めない）
 *
 * balance = initial - charged - refunded
 * 取崩しも返金も預り金を減らす方向。残った balance が「これから返すべき残額」。
 * additional_billing は rent_billings 側で別途追跡されるため残高には影響させない。
 */
export function computeDepositBalance(initial: number, txs: DepositTx[]): DepositSummary {
  let extraInitial = 0;
  let charged = 0;
  let refunded = 0;
  let additionalBilled = 0;

  for (const t of txs) {
    const amt = Number(t.amount) || 0;
    switch (t.transaction_type) {
      case "initial_deposit":
        extraInitial += amt;
        break;
      case "charge":
        charged += amt;
        break;
      case "refund":
        refunded += amt;
        break;
      case "additional_billing":
        additionalBilled += amt;
        break;
    }
  }
  const totalInitial = (Number(initial) || 0) + extraInitial;
  return {
    initial: totalInitial,
    charged,
    refunded,
    additionalBilled,
    balance: totalInitial - charged - refunded,
  };
}
