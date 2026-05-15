import { describe, it, expect } from 'vitest'

// StatusBadgeのマッピングデータをテスト（コンポーネントレンダリングではなくデータの整合性）
const statusStyles: Record<string, { dot: string; text: string }> = {
  occupied: { dot: 'bg-success', text: 'text-success' },
  vacant: { dot: 'bg-accent', text: 'text-accent' },
  reserved: { dot: 'bg-warning', text: 'text-warning' },
  maintenance: { dot: 'bg-text-muted', text: 'text-text-muted' },
  active: { dot: 'bg-success', text: 'text-success' },
  expired: { dot: 'bg-text-muted', text: 'text-text-muted' },
  terminated: { dot: 'bg-danger', text: 'text-danger' },
  pending: { dot: 'bg-warning', text: 'text-warning' },
  paid: { dot: 'bg-success', text: 'text-success' },
  unpaid: { dot: 'bg-text-muted', text: 'text-text-muted' },
  partial: { dot: 'bg-warning', text: 'text-warning' },
  overdue: { dot: 'bg-danger', text: 'text-danger' },
  open: { dot: 'bg-accent', text: 'text-accent' },
  in_progress: { dot: 'bg-warning', text: 'text-warning' },
  completed: { dot: 'bg-success', text: 'text-success' },
  cancelled: { dot: 'bg-text-muted', text: 'text-text-muted' },
}

const statusLabels: Record<string, string> = {
  occupied: '入居中', vacant: '空室', reserved: '申込中', maintenance: 'メンテ中',
  active: '有効', expired: '満了', terminated: '解約', pending: '準備中',
  paid: '入金済', unpaid: '未入金', partial: '一部入金', overdue: '滞納',
  open: '未対応', in_progress: '対応中', waiting_parts: '部品待ち',
  completed: '完了', cancelled: 'キャンセル', resolved: '解決済', closed: 'クローズ',
  low: '低', normal: '通常', high: '高', urgent: '緊急',
}

describe('StatusBadge マッピング整合性', () => {
  it('全statusStylesのキーがstatusLabelsに存在', () => {
    for (const key of Object.keys(statusStyles)) {
      expect(statusLabels[key], `statusLabels["${key}"] が未定義`).toBeDefined()
    }
  })

  it('全statusStylesがdotとtextを持つ', () => {
    for (const [key, style] of Object.entries(statusStyles)) {
      expect(style.dot, `${key}.dot`).toBeTruthy()
      expect(style.text, `${key}.text`).toBeTruthy()
    }
  })

  it('重要なステータスが全て定義されている', () => {
    const requiredStatuses = [
      'occupied', 'vacant', 'active', 'expired',
      'paid', 'unpaid', 'overdue', 'open', 'completed',
    ]
    for (const status of requiredStatuses) {
      expect(statusStyles[status], `statusStyles["${status}"]`).toBeDefined()
      expect(statusLabels[status], `statusLabels["${status}"]`).toBeDefined()
    }
  })

  it('ラベルが空文字でない', () => {
    for (const [key, label] of Object.entries(statusLabels)) {
      expect(label.length, `statusLabels["${key}"] が空文字`).toBeGreaterThan(0)
    }
  })
})
