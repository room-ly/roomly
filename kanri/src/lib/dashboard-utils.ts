// ダッシュボード計算ロジック（純粋関数として抽出）

export interface UnitData {
  status: string
  rent: number
}

export interface BillingData {
  status: string
  total_amount: number
}

export interface ContractData {
  end_date: string | null
}

// 入居率計算
export function calcOccupancyRate(units: UnitData[]): number {
  if (units.length === 0) return 0
  const occupied = units.filter(u => u.status === 'occupied').length
  return Math.round((occupied / units.length) * 1000) / 10
}

// 家賃回収率計算
export function calcCollectionRate(billings: BillingData[]): { rate: number; overdueAmount: number } {
  const totalExpected = billings.reduce((s, b) => s + Number(b.total_amount), 0)
  const totalReceived = billings
    .filter(b => b.status === 'paid')
    .reduce((s, b) => s + Number(b.total_amount), 0)
  const overdueAmount = billings
    .filter(b => b.status === 'overdue')
    .reduce((s, b) => s + Number(b.total_amount), 0)

  return {
    rate: totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 1000) / 10 : 0,
    overdueAmount,
  }
}

// 契約満了間近の件数（90日以内）
export function countExpiringContracts(contracts: ContractData[], now: Date = new Date()): number {
  return contracts.filter(c => {
    if (!c.end_date) return false
    const end = new Date(c.end_date)
    const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff > 0 && diff <= 90
  }).length
}

// アクティブ件数（open or in_progress）
export function countActive(items: { status: string }[]): number {
  return items.filter(i => i.status === 'open' || i.status === 'in_progress').length
}
