"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Check, AlertTriangle, HelpCircle } from "lucide-react";

interface MatchResult {
  csv: { date: string; amount: number; name: string };
  billing_id: string | null;
  tenant_name: string | null;
  tenant_name_kana: string | null;
  unit_label: string | null;
  billing_month: string | null;
  total_amount: number | null;
  remaining_amount: number | null;
  match_type: "exact" | "amount" | "name" | "none";
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RentCsvImportModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "confirm" | "done">("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applyResult, setApplyResult] = useState<{
    applied: number;
    errors: string[];
  } | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  if (!isOpen) return null;

  function reset() {
    setStep("upload");
    setResults([]);
    setSelected(new Set());
    setError("");
    setApplyResult(null);
    setFileName("");
    setDragging(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("CSVファイルを選択してください");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/rent-billings/csv-import?action=match", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }

      setResults(data.results);
      const autoSelected = new Set<number>();
      data.results.forEach((r: MatchResult, i: number) => {
        if (r.match_type === "exact" || r.match_type === "name") {
          autoSelected.add(i);
        }
      });
      setSelected(autoSelected);
      setStep("confirm");
    } catch {
      setError("ファイルのアップロードに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else if (results[idx].billing_id) next.add(idx);
      return next;
    });
  }

  function toggleAll() {
    const matchedIndices = results
      .map((r, i) => (r.billing_id ? i : -1))
      .filter((i) => i >= 0);
    if (matchedIndices.every((i) => selected.has(i))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(matchedIndices));
    }
  }

  async function handleApply() {
    const items = Array.from(selected).map((i) => ({
      billing_id: results[i].billing_id!,
      amount: results[i].csv.amount,
      payment_date: results[i].csv.date || new Date().toISOString().slice(0, 10),
    }));

    setLoading(true);
    try {
      const res = await fetch("/api/rent-billings/csv-import?action=apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }
      setApplyResult(data);
      setStep("done");
    } catch {
      setError("入金登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  const matchBadge = (type: MatchResult["match_type"]) => {
    switch (type) {
      case "exact":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-green-50 text-green-700">
            <Check size={12} /> 完全一致
          </span>
        );
      case "name":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
            <Check size={12} /> 名義一致
          </span>
        );
      case "amount":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700">
            <AlertTriangle size={12} /> 金額一致
          </span>
        );
      case "none":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
            <HelpCircle size={12} /> 不一致
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-line">
          <h2 className="text-[15px] font-semibold">
            {step === "upload" && "入金消込"}
            {step === "confirm" && "マッチング結果の確認"}
            {step === "done" && "一括入金完了"}
          </h2>
          <button
            onClick={handleClose}
            className="text-ink-3 hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          {step === "upload" && (
            <form onSubmit={handleUpload}>
              <p className="text-[13px] text-ink-2 mb-4">
                銀行の入出金明細ファイルをアップロードすると、振込人名義と金額から未入金の家賃請求と自動マッチングします。
              </p>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && fileRef.current) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileRef.current.files = dt.files;
                    setFileName(file.name);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 cursor-pointer transition-colors ${
                  dragging ? "border-accent bg-accent/5" : "border-line hover:border-ink-4"
                }`}
              >
                <Upload size={32} className="mx-auto text-ink-4 mb-3" />
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                />
                {fileName ? (
                  <p className="text-sm text-ink font-medium">{fileName}</p>
                ) : (
                  <p className="text-sm text-ink-3">クリックまたはドラッグ&ドロップでファイルを選択</p>
                )}
                <p className="text-[11px] text-ink-4 mt-2">
                  全銀フォーマット（.txt）またはCSV形式に対応
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading || !fileName}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {loading ? "解析中..." : "マッチング開始"}
                </button>
              </div>
            </form>
          )}

          {step === "confirm" && (
            <>
              <div className="flex items-center gap-4 mb-4 text-[13px] text-ink-2">
                <span>
                  取込データ: <strong>{results.length}</strong>件
                </span>
                <span>
                  マッチ済:{" "}
                  <strong className="text-accent-deep">
                    {results.filter((r) => r.billing_id).length}
                  </strong>
                  件
                </span>
                <span>
                  選択中: <strong>{selected.size}</strong>件
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-line text-ink-3 text-left">
                      <th className="py-2 px-2 w-8">
                        <input
                          type="checkbox"
                          checked={
                            results.filter((r) => r.billing_id).length > 0 &&
                            results.every((r, i) => !r.billing_id || selected.has(i))
                          }
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="py-2 px-2">振込人</th>
                      <th className="py-2 px-2">日付</th>
                      <th className="py-2 px-2 text-right">金額</th>
                      <th className="py-2 px-2">マッチ</th>
                      <th className="py-2 px-2">入居者</th>
                      <th className="py-2 px-2">部屋</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-b border-line/50 ${
                          r.match_type === "none"
                            ? "opacity-50"
                            : selected.has(i)
                              ? "bg-accent/5"
                              : ""
                        }`}
                      >
                        <td className="py-2 px-2">
                          <input
                            type="checkbox"
                            checked={selected.has(i)}
                            disabled={!r.billing_id}
                            onChange={() => toggleSelect(i)}
                          />
                        </td>
                        <td className="py-2 px-2 font-medium">{r.csv.name || "—"}</td>
                        <td className="py-2 px-2 mono text-ink-2">{r.csv.date}</td>
                        <td className="py-2 px-2 text-right tabular-nums">
                          <div>¥{r.csv.amount.toLocaleString()}</div>
                          {r.remaining_amount != null && r.csv.amount !== r.remaining_amount && (
                            <div className={`text-[11px] ${r.csv.amount > r.remaining_amount ? "text-blue-600" : "text-danger"}`}>
                              {r.csv.amount > r.remaining_amount
                                ? `+¥${(r.csv.amount - r.remaining_amount).toLocaleString()} 超過`
                                : `-¥${(r.remaining_amount - r.csv.amount).toLocaleString()} 不足`}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2">{matchBadge(r.match_type)}</td>
                        <td className="py-2 px-2">
                          {r.tenant_name ? (
                            <div>
                              <div>{r.tenant_name}</div>
                              {r.tenant_name_kana && (
                                <div className="text-[11px] text-ink-4">
                                  {r.tenant_name_kana}
                                </div>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 px-2 text-ink-2">{r.unit_label || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={reset}
                  className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm"
                >
                  やり直す
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={loading || selected.size === 0}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {loading
                      ? "登録中..."
                      : `${selected.size}件を入金登録`}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "done" && applyResult && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {applyResult.applied}件の入金を登録しました
              </h3>
              {applyResult.errors.length > 0 && (
                <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mt-4 text-left">
                  {applyResult.errors.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  handleClose();
                  router.refresh();
                }}
                className="btn btn-primary mt-6"
              >
                閉じる
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
