"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Sparkles } from "lucide-react";
import {
  generateSampleCsv,
  PROPERTY_COLUMNS,
  TENANT_COLUMNS,
  UNIT_COLUMNS,
} from "@/lib/csv-import";
import StandardTab from "./csv-import/StandardTab";
import AiWaitlistTab, { type WaitlistStatus } from "./csv-import/AiWaitlistTab";
import PreviewView from "./csv-import/PreviewView";
import { DoneView, ErrorView, type ImportResult } from "./csv-import/ResultView";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "properties" | "tenants" | "units";
  // 部屋(units)インポート時に必須。取り込み先の物件ID
  propertyId?: string;
}

type ImportState = "select" | "preview" | "importing" | "done" | "error";

export default function CsvImportModal({
  isOpen,
  onClose,
  type,
  propertyId,
}: CsvImportModalProps) {
  const router = useRouter();
  const [state, setState] = useState<ImportState>("select");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"standard" | "ai">("standard");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistNote, setWaitlistNote] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>("idle");
  const [waitlistError, setWaitlistError] = useState("");

  if (!isOpen) return null;

  const label = type === "properties" ? "物件" : type === "units" ? "部屋" : "入居者";
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
      .replace(/^﻿/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    const headers = lines[0]?.split(",").map((h) => h.replace(/"/g, "").trim()) ?? [];
    const rows = lines
      .slice(1, 6)
      .map((line) => line.split(",").map((v) => v.replace(/"/g, "").trim()));
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
          <h2 className="text-lg font-semibold text-ink">{label}をCSVインポート</h2>
          <button onClick={handleClose} className="text-ink-3 hover:text-ink">
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
          {state === "select" && tab === "standard" && (
            <StandardTab
              columns={columns}
              onFileSelect={handleFileSelect}
              onDownloadSample={handleDownloadSample}
            />
          )}

          {state === "select" && tab === "ai" && (
            <AiWaitlistTab
              label={label}
              email={waitlistEmail}
              setEmail={setWaitlistEmail}
              note={waitlistNote}
              setNote={setWaitlistNote}
              status={waitlistStatus}
              error={waitlistError}
              onSubmit={handleWaitlistSubmit}
            />
          )}

          {state === "preview" && (() => {
            const { headers, rows, totalRows } = getPreviewData();
            return (
              <PreviewView
                fileName={fileName}
                headers={headers}
                rows={rows}
                totalRows={totalRows}
              />
            );
          })()}

          {state === "importing" && (
            <div className="py-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-ink-2">インポート中...</p>
            </div>
          )}

          {state === "done" && result && <DoneView result={result} />}
          {state === "error" && <ErrorView error={error} result={result} />}
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
              <button
                onClick={handleImport}
                disabled={(state as ImportState) === "importing"}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-wait"
              >
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
