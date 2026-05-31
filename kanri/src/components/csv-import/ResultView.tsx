"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface ImportResult {
  inserted: number;
  skipped: number;
  rowErrors?: { row: number; errors: string[] }[];
  parseErrors?: string[];
}

export function DoneView({ result }: { result: ImportResult }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-accent-deep">
        <CheckCircle2 size={24} />
        <span className="font-medium">インポートが完了しました</span>
      </div>
      <div className="bg-accent-tint rounded-lg p-4 text-sm">
        <p>
          <span className="font-medium">{result.inserted}件</span>
          を登録しました
        </p>
        {result.skipped > 0 && (
          <p className="text-orange-600 mt-1">
            {result.skipped}件はエラーによりスキップされました
          </p>
        )}
      </div>
      {result.rowErrors && result.rowErrors.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm font-medium text-orange-800 mb-2">スキップされた行</p>
          <ul className="text-xs text-orange-700 space-y-1">
            {result.rowErrors.slice(0, 10).map((re, i) => (
              <li key={i}>
                {re.row}行目: {re.errors.join(", ")}
              </li>
            ))}
            {result.rowErrors.length > 10 && (
              <li>...他{result.rowErrors.length - 10}件</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ErrorView({ error, result }: { error: string; result: ImportResult | null }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-danger">
        <AlertCircle size={24} />
        <span className="font-medium">{error}</span>
      </div>
      {result?.rowErrors && result.rowErrors.length > 0 && (
        <div className="bg-danger-tint rounded-lg p-4">
          <p className="text-sm font-medium text-danger mb-2">エラー詳細</p>
          <ul className="text-xs text-danger space-y-1">
            {result.rowErrors.slice(0, 10).map((re, i) => (
              <li key={i}>
                {re.row}行目: {re.errors.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
