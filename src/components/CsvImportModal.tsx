"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Download, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  generateSampleCsv,
  PROPERTY_COLUMNS,
  TENANT_COLUMNS,
} from "@/lib/csv-import";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "properties" | "tenants";
}

type ImportState = "select" | "preview" | "importing" | "done" | "error";

interface ImportResult {
  inserted: number;
  skipped: number;
  rowErrors?: { row: number; errors: string[] }[];
  parseErrors?: string[];
}

export default function CsvImportModal({
  isOpen,
  onClose,
  type,
}: CsvImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>("select");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const label = type === "properties" ? "物件" : "入居者";
  const columns = type === "properties" ? PROPERTY_COLUMNS : TENANT_COLUMNS;

  function handleClose() {
    setState("select");
    setCsvText("");
    setFileName("");
    setResult(null);
    setError("");
    onClose();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      setState("preview");
    };
    reader.readAsText(file, "utf-8");
  }

  function handleDownloadSample() {
    const csv = generateSampleCsv(columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_sample.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // プレビュー用: CSVの先頭数行を表示
  function getPreviewData() {
    const lines = csvText
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    const headers = lines[0]?.split(",").map((h) => h.replace(/"/g, "").trim()) ?? [];
    const rows = lines.slice(1, 6).map((line) =>
      line.split(",").map((v) => v.replace(/"/g, "").trim())
    );
    const totalRows = lines.length - 1;
    return { headers, rows, totalRows };
  }

  async function handleImport() {
    setState("importing");
    setError("");

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, csvText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "インポートに失敗しました");
        if (data.rowErrors || data.parseErrors) {
          setResult({
            inserted: 0,
            skipped: data.rowErrors?.length ?? 0,
            rowErrors: data.rowErrors,
            parseErrors: data.parseErrors,
          });
        }
        setState("error");
        return;
      }

      setResult(data);
      setState("done");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
      setState("error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {label}をCSVインポート
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {/* ファイル選択 */}
          {state === "select" && (
            <div className="space-y-6">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload
                  size={40}
                  className="mx-auto text-gray-400 mb-3"
                />
                <p className="text-sm text-gray-600 mb-1">
                  CSVファイルをクリックして選択
                </p>
                <p className="text-xs text-gray-400">
                  UTF-8エンコーディング推奨
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  CSVフォーマット
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  以下のヘッダー名でCSVを作成してください。
                  サンプルCSVをダウンロードすると簡単です。
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {columns.map((col) => (
                    <span
                      key={col.dbField}
                      className={`text-xs px-2 py-0.5 rounded ${
                        col.required
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {col.csvHeader}
                      {col.required && " *"}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleDownloadSample}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800"
                >
                  <Download size={14} />
                  サンプルCSVをダウンロード
                </button>
              </div>
            </div>
          )}

          {/* プレビュー */}
          {state === "preview" && (() => {
            const { headers, rows, totalRows } = getPreviewData();
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText size={16} />
                  <span>{fileName}</span>
                  <span className="text-gray-400">（{totalRows}件）</span>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        {headers.map((h, i) => (
                          <th
                            key={i}
                            className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-t">
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="px-3 py-2 text-gray-600 whitespace-nowrap"
                            >
                              {cell || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalRows > 5 && (
                  <p className="text-xs text-gray-400">
                    先頭5件を表示しています（全{totalRows}件）
                  </p>
                )}
              </div>
            );
          })()}

          {/* インポート中 */}
          {state === "importing" && (
            <div className="py-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-gray-600">インポート中...</p>
            </div>
          )}

          {/* 完了 */}
          {state === "done" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 size={24} />
                <span className="font-medium">インポートが完了しました</span>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-sm">
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
                  <p className="text-sm font-medium text-orange-800 mb-2">
                    スキップされた行
                  </p>
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
          )}

          {/* エラー */}
          {state === "error" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={24} />
                <span className="font-medium">{error}</span>
              </div>
              {result?.rowErrors && result.rowErrors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    エラー詳細
                  </p>
                  <ul className="text-xs text-red-700 space-y-1">
                    {result.rowErrors.slice(0, 10).map((re, i) => (
                      <li key={i}>
                        {re.row}行目: {re.errors.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          {state === "select" && (
            <button onClick={handleClose} className="btn-secondary">
              閉じる
            </button>
          )}
          {state === "preview" && (
            <>
              <button
                onClick={() => {
                  setState("select");
                  setCsvText("");
                  setFileName("");
                }}
                className="btn-secondary"
              >
                戻る
              </button>
              <button onClick={handleImport} className="btn-primary">
                <Upload size={14} />
                {label}をインポート
              </button>
            </>
          )}
          {(state === "done" || state === "error") && (
            <button onClick={handleClose} className="btn-primary">
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
