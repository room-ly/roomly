const statusStyles: Record<string, string> = {
  // 部屋ステータス
  occupied: "bg-success/10 text-success ring-success/20",
  vacant: "bg-accent/10 text-accent ring-accent/20",
  reserved: "bg-warning/10 text-warning ring-warning/20",
  maintenance: "bg-bg-secondary text-text-muted ring-border",
  // 契約ステータス
  active: "bg-success/10 text-success ring-success/20",
  expired: "bg-bg-secondary text-text-muted ring-border",
  terminated: "bg-danger/10 text-danger ring-danger/20",
  pending: "bg-warning/10 text-warning ring-warning/20",
  // 請求ステータス
  paid: "bg-success/10 text-success ring-success/20",
  unpaid: "bg-bg-secondary text-text-muted ring-border",
  partial: "bg-warning/10 text-warning ring-warning/20",
  overdue: "bg-danger/10 text-danger ring-danger/20",
  // 修繕ステータス
  open: "bg-accent/10 text-accent ring-accent/20",
  in_progress: "bg-warning/10 text-warning ring-warning/20",
  waiting_parts: "bg-warning/10 text-warning ring-warning/20",
  completed: "bg-success/10 text-success ring-success/20",
  cancelled: "bg-bg-secondary text-text-muted ring-border",
  // 問い合わせ
  resolved: "bg-success/10 text-success ring-success/20",
  closed: "bg-bg-secondary text-text-muted ring-border",
  // 優先度
  low: "bg-bg-secondary text-text-muted ring-border",
  normal: "bg-accent/10 text-accent ring-accent/20",
  high: "bg-warning/10 text-warning ring-warning/20",
  urgent: "bg-danger/10 text-danger ring-danger/20",
};

const statusLabels: Record<string, string> = {
  occupied: "入居中",
  vacant: "空室",
  reserved: "申込中",
  maintenance: "メンテ中",
  active: "有効",
  expired: "満了",
  terminated: "解約",
  pending: "準備中",
  paid: "入金済",
  unpaid: "未入金",
  partial: "一部入金",
  overdue: "滞納",
  open: "未対応",
  in_progress: "対応中",
  waiting_parts: "部品待ち",
  completed: "完了",
  cancelled: "キャンセル",
  resolved: "解決済",
  closed: "クローズ",
  low: "低",
  normal: "通常",
  high: "高",
  urgent: "緊急",
  fixed: "定期",
  ordinary: "普通",
  general: "一般",
  complaint: "クレーム",
  noise: "騒音",
  facility: "設備",
  move_out: "退去",
  other: "その他",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-bg-secondary text-text-muted ring-border";
  const text = label || statusLabels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${style}`}>
      {text}
    </span>
  );
}
