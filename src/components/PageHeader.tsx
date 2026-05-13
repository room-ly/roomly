interface PageHeaderProps {
  title: string;
  em?: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, em, eyebrow, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-7 gap-3 sm:gap-4">
      <div>
        {eyebrow && (
          <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-ink-3">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-2 text-xl sm:text-2xl md:text-[30px] leading-[1.15] tracking-tight font-semibold">
          {title}{" "}
          {em && <em className="not-italic font-semibold text-accent-deep">{em}</em>}
        </h1>
        {description && (
          <p className="mt-1.5 sm:mt-2.5 text-ink-3 text-[13px] sm:text-[14px] max-w-[60ch]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
