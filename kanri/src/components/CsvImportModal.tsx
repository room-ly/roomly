"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Construction,
} from "lucide-react";
import {
  generateSampleCsv,
  PROPERTY_COLUMNS,
  TENANT_COLUMNS,
  UNIT_COLUMNS,
} from "@/lib/csv-import";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "properties" | "tenants" | "units";
  // 部屋(units)インポート時に必須。取り込み先の物件ID
  propertyId?: string;
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
  propertyId,
}: CsvImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>("select");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"standard" | "ai">("standard");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistNote, setWaitlistNote] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");
  const [waitlistError, setWaitlistError] = useState("");

  if (!isOpen) return null;

  const label =
    type === "properties" ? "物件" : type === "units" ? "部屋" : "入居者";
  const columns =
    type === "properties"
      ? PROPERTY_COLUMNS
      : type === "units"
        ? UNIT_COLUMNS
        : TENANT_COLUMNS;

  function handleClose() {
    setState("select");
    setCsvText("");
    setFileName("");
    setResult(null);
    setError("");
    setTab("standard");
    setWaitlistEmail("");
    setWaitlistNote("");
    setWaitlistStatus("idle");
    setWaitlistError("");
    onClose();
  }

  async function handleWaitlistSubmit() {
    if (!waitlistEmail.trim() || !waitlistEmail.includes("@")) {
      setWaitlistError("有効なメールアドレスを入力してください");
      return;
    }
    setWaitlistStatus("sending");
    setWaitlistError("");
    try {
      const res = await fetch("/api/import/ai-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          email: waitlistEmail.trim(),
          note: waitlistNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWaitlistError(data.error || "送信に失敗しました");
        setWaitlistStatus("error");
        return;
      }
      setWaitlistStatus("done");
    } catch {
      setWaitlistError("通信エラーが発生しました");
      setWaitlistStatus("error");
    }
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
        body: JSON.stringify({ type, csvText, property_id: propertyId }),
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
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-lg font-semibold text-ink">
            {label}をCSVインポート
          </h2>
          <button
            onClick={handleClose}
            className="text-ink-3 hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        {/* タブ（select状態のみ表示） */}
        {state === "select" && (
          <div className="px-6 pt-3 border-b border-line">
            <div className="flex gap-1">
              <button
                onClick={() => setTab("standard")}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === "standard"
                    ? "border-accent text-accent"
                    : "border-transparent text-ink-3 hover:text-ink-2"
                }`}
              >
                標準フォーマット
              </button>
              <button
                onClick={() => setTab("ai")}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5 ${
                  tab === "ai"
                    ? "border-accent text-accent"
                    : "border-transparent text-ink-3 hover:text-ink-2"
                }`}
              >
                <Sparkles size={14} />
                AI変換
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-normal">
                  近日公開
                </span>
              </button>
            </div>
          </div>
        )}

        {/* コンテンツ */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {/* ファイル選択（標準フォーマットタブ） */}
          {state === "select" && tab === "standard" && (
            <div className="space-y-6">
              <div
                className="border-2 border-dashed border-line-2 rounded-lg p-8 text-center cursor-pointer hover:border-accent hover:bg-accent-tint/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload
                  size={40}
                  className="mx-auto text-ink-4 mb-3"
                />
                <p className="text-sm text-ink-2 mb-1">
                  CSVファイルをクリックして選択
                </p>
                <p className="text-xs text-ink-3">
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

              <div className="bg-surface-2 rounded-lg p-4">
                <h3 className="text-sm font-medium text-ink-2 mb-2">
                  CSVフォーマット
                </h3>
                <p className="text-xs text-ink-3 mb-3">
                  以下のヘッダー名でCSVを作成してください。
                  サンプルCSVをダウンロードすると簡単です。
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
                  onClick={handleDownloadSample}
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-deep"
                >
                  <Download size={14} />
                  サンプルCSVをダウンロード
                </button>
              </div>
            </div>
          )}

          {/* AI変換タブ（近日公開・事前登録フォーム） */}
          {state === "select" && tab === "ai" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-accent-tint bg-gradient-to-br from-accent-tint/40 to-transparent p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Sparkles size={20} className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
                      AIで独自フォーマットを変換
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning">
                        <Construction size={10} />
                        近日公開予定
                      </span>
                    </h3>
                    <p className="text-xs text-ink-2 leading-relaxed">
                      Excel・Googleスプレッドシート・他社管理ソフトからの書き出しなど、
                      独自の{label}リストをAIが自動でRoomlyの形式に変換してインポートします。
                      ヘッダー名・列順・表記ゆれが違っていても、そのままアップロードできるようになります。
                    </p>
                  </div>
                </div>
              </div>

              {waitlistStatus === "done" ? (
                <div className="rounded-lg bg-accent-tint p-5 text-center">
                  <CheckCircle2
                    size={32}
                    className="mx-auto text-accent-deep mb-2"
                  />
                  <p className="text-sm font-medium text-ink mb-1">
                    事前登録ありがとうございます
                  </p>
                  <p className="text-xs text-ink-2">
                    公開時に <strong>{waitlistEmail}</strong> 宛にご連絡します。
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-ink-2">
                    公開時に通知を受け取りたい方はこちらからご登録ください。
                    現在お使いのフォーマット例を添えていただくと、優先的に対応します。
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-ink-2 mb-1">
                      通知先メールアドレス <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input w-full text-sm"
                      disabled={waitlistStatus === "sending"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-2 mb-1">
                      現在お使いのフォーマット・ご要望（任意）
                    </label>
                    <textarea
                      value={waitlistNote}
                      onChange={(e) => setWaitlistNote(e.target.value)}
                      placeholder={`例: 自社のExcel台帳をそのまま${label}リストとして使っています。列構成は…`}
                      rows={4}
                      className="input w-full text-sm resize-none"
                      disabled={waitlistStatus === "sending"}
                    />
                  </div>
                  {waitlistError && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <AlertCircle size={12} />
                      {waitlistError}
                    </p>
                  )}
                  <button
                    onClick={handleWaitlistSubmit}
                    disabled={waitlistStatus === "sending"}
                    className="btn btn-primary w-full"
                  >
                    {waitlistStatus === "sending" ? (
                      <>
                        <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                        送信中...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        公開時に通知を受け取る
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* プレビュー */}
          {state === "preview" && (() => {
            const { headers, rows, totalRows } = getPreviewData();
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
                            <td
                              key={j}
                              className="px-3 py-2 text-ink-2 whitespace-nowrap"
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
                  <p className="text-xs text-ink-3">
                    先頭5件を表示しています（全{totalRows}件）
                  </p>
                )}
              </div>
            );
          })()}

          {/* インポート中 */}
          {state === "importing" && (
            <div className="py-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-ink-2">インポート中...</p>
            </div>
          )}

          {/* 完了 */}
          {state === "done" && result && (
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
              <div className="flex items-center gap-2 text-danger">
                <AlertCircle size={24} />
                <span className="font-medium">{error}</span>
              </div>
              {result?.rowErrors && result.rowErrors.length > 0 && (
                <div className="bg-danger-tint rounded-lg p-4">
                  <p className="text-sm font-medium text-danger mb-2">
                    エラー詳細
                  </p>
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
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-line flex justify-end gap-3">
          {state === "select" && (
            <button onClick={handleClose} className="btn btn-secondary">
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
                className="btn btn-secondary"
              >
                戻る
              </button>
              <button onClick={handleImport} className="btn btn-primary">
                <Upload size={14} />
                {label}をインポート
              </button>
            </>
          )}
          {(state === "done" || state === "error") && (
            <button onClick={handleClose} className="btn btn-primary">
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
