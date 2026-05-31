"use client";

import { useRef } from "react";
import { Upload, Download } from "lucide-react";
import type { ColumnMapping } from "@/lib/csv-import";

export default function StandardTab({
  columns,
  onFileSelect,
  onDownloadSample,
}: {
  columns: readonly ColumnMapping[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadSample: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed border-line-2 rounded-lg p-8 text-center cursor-pointer hover:border-accent hover:bg-accent-tint/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={40} className="mx-auto text-ink-4 mb-3" />
        <p className="text-sm text-ink-2 mb-1">CSVファイルをクリックして選択</p>
        <p className="text-xs text-ink-3">UTF-8エンコーディング推奨</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={onFileSelect}
          className="hidden"
        />
      </div>

      <div className="bg-surface-2 rounded-lg p-4">
        <h3 className="text-sm font-medium text-ink-2 mb-2">CSVフォーマット</h3>
        <p className="text-xs text-ink-3 mb-3">
          以下のヘッダー名でCSVを作成してください。サンプルCSVをダウンロードすると簡単です。
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {columns.map((col) => (
            <span
              key={col.dbField}
              className={`text-xs px-2 py-0.5 rounded ${
                col.required
                  ? "bg-accent-tint text-accent-deep font-medium"
                  : "bg-bg-2 text-ink-2"
              }`}
            >
              {col.csvHeader}
              {col.required && " *"}
            </span>
          ))}
        </div>
        <button
          onClick={onDownloadSample}
          className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-deep"
        >
          <Download size={14} />
          サンプルCSVをダウンロード
        </button>
      </div>
    </div>
  );
}
