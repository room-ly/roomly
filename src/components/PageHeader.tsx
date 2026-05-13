interface PageHeaderProps {
  title: string;
  em?: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, em, eyebrow, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-7 gap-4">
      <div>
        {eyebrow && (
          <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-ink-3">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-2 text-[30px] leading-[1.15] tracking-tight font-semibold">
          {title}{" "}
          {em && <em className="not-italic font-semibold text-accent-deep">{em}</em>}
        </h1>
        {description && (
          <p className="mt-2.5 text-ink-3 text-[14px] max-w-[60ch]">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
