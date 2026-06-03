// 返済予定表（償還予定表）の生成ロジック
//
// 銀行APIではローン残高・返済予定を取得できない（制度上ほぼ不可）ため、
// 借入条件から返済予定表を自分で計算して展開する。
// 銀行発行の償還予定表と1円単位でズレることがあるため、生成後は手動編集できる前提。

export type RepaymentMethod = "equal_principal_and_interest" | "equal_principal";

export interface ScheduleInput {
  principal: number; // 借入元本（円）
  annualRatePercent: number; // 年利（%）。例: 1.875
  termMonths: number; // 返済回数（月数）
  firstPaymentDate: string; // 初回返済日 YYYY-MM-DD
  method: RepaymentMethod;
}

export interface ScheduleRow {
  installment_no: number;
  payment_date: string; // YYYY-MM-DD
  principal_amount: number;
  interest_amount: number;
  balance_after: number;
}

// 初回返済日を起点に、N回目の返済日（毎月同日）を返す。
// 月末日は短い月にクランプする（例: 1/31 起点 → 2月は末日）。
function addMonths(baseISO: string, monthsToAdd: number): string {
  const [y, m, d] = baseISO.split("-").map(Number);
  // m は1始まり。0始まりに直して加算
  const totalMonth = (m - 1) + monthsToAdd;
  const year = y + Math.floor(totalMonth / 12);
  const month0 = ((totalMonth % 12) + 12) % 12; // 0始まり
  const lastDay = new Date(year, month0 + 1, 0).getDate(); // 当月末日
  const day = Math.min(d, lastDay);
  const mm = String(month0 + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// 元利均等返済の毎月返済額（円・四捨五入）
function equalPaymentAmount(principal: number, monthlyRate: number, n: number): number {
  if (monthlyRate === 0) return Math.round(principal / n);
  const f = Math.pow(1 + monthlyRate, n);
  return Math.round((principal * monthlyRate * f) / (f - 1));
}

// 返済予定表を生成する。
// 端数は各回で四捨五入し、最終回で残高を必ず0に合わせる（銀行実務に倣う）。
export function generateSchedule(input: ScheduleInput): ScheduleRow[] {
  const { principal, annualRatePercent, termMonths, firstPaymentDate, method } = input;
  if (principal <= 0 || termMonths <= 0) return [];

  const monthlyRate = annualRatePercent / 100 / 12;
  const rows: ScheduleRow[] = [];
  let balance = principal;

  const fixedPayment =
    method === "equal_principal_and_interest"
      ? equalPaymentAmount(principal, monthlyRate, termMonths)
      : 0;
  // 元金均等の毎月元金（最終回で端数調整）
  const flatPrincipal = method === "equal_principal" ? Math.floor(principal / termMonths) : 0;

  for (let i = 1; i <= termMonths; i++) {
    const interest = Math.round(balance * monthlyRate);
    let principalPart: number;

    if (i === termMonths) {
      // 最終回は残高を全額返済して端数を吸収
      principalPart = balance;
    } else if (method === "equal_principal_and_interest") {
      principalPart = fixedPayment - interest;
    } else {
      principalPart = flatPrincipal;
    }

    // 念のため元金が残高を超えないようにする
    if (principalPart > balance) principalPart = balance;
    balance -= principalPart;

    rows.push({
      installment_no: i,
      payment_date: addMonths(firstPaymentDate, i - 1),
      principal_amount: principalPart,
      interest_amount: interest,
      balance_after: balance,
    });
  }

  return rows;
}
