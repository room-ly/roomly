"use client";

import { FileText } from "lucide-react";

export default function PreviewView({
  fileName,
  headers,
  rows,
  totalRows,
}: {
  fileName: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-ink-2">
        <FileText size={16} />
        <span>{fileName}</span>
        <span className="text-ink-3">（{totalRows}件）</span>
      </div>

      <div className="overflow-x-auto border border-line rounded-lg">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-2">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left font-medium text-ink-2 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-line">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-ink-2 whitespace-nowrap">
                    {cell || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalRows > 5 && (
        <p className="text-xs text-ink-3">
          先頭5件を表示しています（全{totalRows}件）
        </p>
      )}
    </div>
  );
}
