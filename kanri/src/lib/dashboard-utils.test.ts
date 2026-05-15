import { describe, it, expect } from 'vitest'
import { calcOccupancyRate, calcCollectionRate, countExpiringContracts, countActive } from './dashboard-utils'

describe('calcOccupancyRate', () => {
  it('全室入居', () => {
    const units = [
      { status: 'occupied', rent: 80000 },
      { status: 'occupied', rent: 90000 },
    ]
    expect(calcOccupancyRate(units)).toBe(100)
  })

  it('半分入居', () => {
    const units = [
      { status: 'occupied', rent: 80000 },
      { status: 'vacant', rent: 90000 },
    ]
    expect(calcOccupancyRate(units)).toBe(50)
  })

  it('空室のみ', () => {
    const units = [
      { status: 'vacant', rent: 80000 },
      { status: 'maintenance', rent: 90000 },
    ]
    expect(calcOccupancyRate(units)).toBe(0)
  })

  it('空配列', () => {
    expect(calcOccupancyRate([])).toBe(0)
  })

  it('小数点1桁（3室中2室 = 66.7%）', () => {
    const units = [
      { status: 'occupied', rent: 80000 },
      { status: 'occupied', rent: 90000 },
      { status: 'vacant', rent: 70000 },
    ]
    expect(calcOccupancyRate(units)).toBe(66.7)
  })
})

describe('calcCollectionRate', () => {
  it('全額回収', () => {
    const billings = [
      { status: 'paid', total_amount: 100000 },
      { status: 'paid', total_amount: 90000 },
    ]
    const result = calcCollectionRate(billings)
    expect(result.rate).toBe(100)
    expect(result.overdueAmount).toBe(0)
  })

  it('一部滞納', () => {
    const billings = [
      { status: 'paid', total_amount: 100000 },
      { status: 'overdue', total_amount: 50000 },
    ]
    const result = calcCollectionRate(billings)
    // 100000 / 150000 = 66.666... → 66.7
    expect(result.rate).toBe(66.7)
    expect(result.overdueAmount).toBe(50000)
  })

  it('空配列', () => {
    const result = calcCollectionRate([])
    expect(result.rate).toBe(0)
    expect(result.overdueAmount).toBe(0)
  })

  it('未入金（滞納ではない）は回収率に影響', () => {
    const billings = [
      { status: 'paid', total_amount: 100000 },
      { status: 'unpaid', total_amount: 100000 },
    ]
    const result = calcCollectionRate(billings)
    expect(result.rate).toBe(50)
    expect(result.overdueAmount).toBe(0)
  })
})

describe('countExpiringContracts', () => {
  const now = new Date('2026-03-07')

  it('90日以内に満了する契約', () => {
    const contracts = [
      { end_date: '2026-04-01' }, // 25日後
      { end_date: '2026-06-04' }, // 89日後
    ]
    expect(countExpiringContracts(contracts, now)).toBe(2)
  })

  it('91日後は含まない', () => {
    const contracts = [
      { end_date: '2026-06-06' }, // 91日後
    ]
    expect(countExpiringContracts(contracts, now)).toBe(0)
  })

  it('過去の日付は含まない', () => {
    const contracts = [
      { end_date: '2026-03-01' }, // 過去
    ]
    expect(countExpiringContracts(contracts, now)).toBe(0)
  })

  it('end_dateがnullは含まない', () => {
    const contracts = [
      { end_date: null },
    ]
    expect(countExpiringContracts(contracts, now)).toBe(0)
  })

  it('空配列', () => {
    expect(countExpiringContracts([], now)).toBe(0)
  })
})

describe('countActive', () => {
  it('openとin_progressをカウント', () => {
    const items = [
      { status: 'open' },
      { status: 'in_progress' },
      { status: 'completed' },
      { status: 'cancelled' },
    ]
    expect(countActive(items)).toBe(2)
  })

  it('空配列', () => {
    expect(countActive([])).toBe(0)
  })

  it('該当なし', () => {
    const items = [{ status: 'completed' }, { status: 'closed' }]
    expect(countActive(items)).toBe(0)
  })
})
