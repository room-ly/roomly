interface PageHeaderProps {
  title: string;
  em?: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, em, eyebrow, description, action }: PageHeaderProps) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && (
          <span className="eyebrow mono">{eyebrow}</span>
        )}
        <h1>
          {title}{" "}
          {em && <em>{em}</em>}
        </h1>
        {description && (
          <p className="mt-1.5 sm:mt-2.5 text-ink-3 text-[13px] sm:text-[14px] max-w-[60ch]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
