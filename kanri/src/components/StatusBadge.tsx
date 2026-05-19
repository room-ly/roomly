type BadgeVariant = "accent" | "warn" | "danger" | "info" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  accent: "bg-accent-tint text-accent-deep",
  warn: "bg-warn-tint text-warn",
  danger: "bg-danger-tint text-danger",
  info: "bg-info-tint text-info",
  neutral: "bg-bg-2 text-ink-2",
};

const statusVariant: Record<string, BadgeVariant> = {
  occupied: "accent",
  vacant: "info",
  reserved: "warn",
  maintenance: "neutral",
  active: "accent",
  expired: "neutral",
  terminated: "danger",
  pending: "warn",
  paid: "accent",
  unpaid: "neutral",
  partial: "warn",
  overdue: "danger",
  open: "info",
  in_progress: "warn",
  waiting_parts: "warn",
  completed: "accent",
  cancelled: "neutral",
  resolved: "accent",
  closed: "neutral",
  low: "neutral",
  normal: "info",
  high: "warn",
  urgent: "danger",
  draft: "neutral",
  confirmed: "accent",
  sent: "accent",
  repair: "warn",
  cleaning: "info",
  insurance: "accent",
  tax: "danger",
  utility: "neutral",
};

const statusLabels: Record<string, string> = {
  occupied: "入居中",
  vacant: "空室",
  reserved: "申込中",
  maintenance: "メンテ中",
  active: "契約中",
  expired: "満了",
  terminated: "解約済",
  pending: "申請中",
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
  closed: "終了",
  low: "低",
  normal: "通常",
  high: "高",
  urgent: "緊急",
  fixed: "定期借家",
  ordinary: "普通借家",
  general: "一般",
  complaint: "クレーム",
  noise: "騒音",
  facility: "設備",
  move_out: "退去",
  other: "その他",
  repair: "修繕費",
  cleaning: "清掃費",
  insurance: "保険料",
  tax: "税金",
  utility: "光熱費",
  draft: "下書き",
  confirmed: "確定",
  sent: "送金済",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const variant = statusVariant[status] || "neutral";
  const cls = variantClasses[variant];
  const text = label || statusLabels[status] || status;

  return (
    <span className={`badge ${cls}`}>
      <span className="dot" />
      {text}
    </span>
  );
}
