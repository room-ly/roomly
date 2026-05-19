"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ServerPaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export default function ServerPagination({ page, pageSize, total }: ServerPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  function buildHref(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between mt-4 text-[12px] sm:text-[13px]">
      <span className="text-ink-3 hidden sm:inline">
        {total}件中 {from}-{to}件
      </span>
      <span className="text-ink-3 sm:hidden">
        {page}/{totalPages}
      </span>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="p-1.5 rounded hover:bg-bg-2 transition-colors"
          >
            <ChevronLeft size={14} />
          </Link>
        ) : (
          <span className="p-1.5 rounded opacity-30 cursor-not-allowed">
            <ChevronLeft size={14} />
          </span>
        )}
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }
          return (
            <Link
              key={pageNum}
              href={buildHref(pageNum)}
              className={`w-7 h-7 rounded text-[12px] transition-colors flex items-center justify-center ${
                pageNum === page
                  ? "bg-accent text-white"
                  : "hover:bg-bg-2 text-ink-2"
              }`}
            >
              {pageNum}
            </Link>
          );
        })}
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="p-1.5 rounded hover:bg-bg-2 transition-colors"
          >
            <ChevronRight size={14} />
          </Link>
        ) : (
          <span className="p-1.5 rounded opacity-30 cursor-not-allowed">
            <ChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  );
}
