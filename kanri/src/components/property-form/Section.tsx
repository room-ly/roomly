"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-line rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-2 text-[13px] font-medium text-ink-2 hover:bg-bg-2/80 transition-colors"
      >
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}
