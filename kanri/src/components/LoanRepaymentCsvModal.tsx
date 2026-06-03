"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Upload } from "lucide-react";
import { parseCsv } from "@/lib/csv-import";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
}

// 列名の揺れを吸収するためのエイリアス
const ALIASES: Record<string, string[]> = {
  installment_no: ["回", "回数", "回次", "no", "installment_no", "回数（回）"],
  payment_date: ["返済日", "日付", "約定日", "payment_date", "date"],
  principal_amount: ["元金", "元本", "principal", "principal_amount", "元金（円）"],
  interest_amount: ["利息", "利子", "interest", "interest_amount", "利息（円）"],
  balance_after: ["残高", "返済後残高", "残元金", "balance", "balance_after"],
};

function mapHeader(h: string): string | null {
  const norm = h.trim().toLowerCase().replace(/\s/g, "");
  for (const [key, aliases] of Object.entries(ALIASES)) {
    if (aliases.some((a) => a.toLowerCase().replace(/\s/g, "") === norm)) return key;
  }
  return null;
}

// 日付の揺れ（2026/7/10, 2026年7月10日 等）を YYYY-MM-DD に正規化
function normalizeDate(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  let m = t.match(/(\d{4})[/年.-](\d{1,2})[/月.-](\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return t;
  return null;
}

function toNum(s: string | undefined): number {
  if (!s) return 0;
  return Number(s.replace(/[,¥円\s]/g, "")) || 0;
}

export default function LoanRepaymentCsvModal({ isOpen, onClose, loanId }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState("");
  const [replace, setReplace] = useState(true);
  const [loading, setLoading] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setRows([]);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { headers, rows: rawRows, errors } = parseCsv(text);
      if (errors.length > 0) {
        setError(errors.join(" / "));
        return;
      }
      // ヘッダーマッピング
      const colMap: Record<number, string> = {};
      headers.forEach((h, i) => {
        const key = mapHeader(h);
        if (key) colMap[i] = key;
      });
      const mappedKeys = Object.values(colMap);
      if (!mappedKeys.includes("payment_date")) {
        setError("返済日の列が見つかりません。ヘッダーに「返済日」を含めてください。");
        return;
      }
      const parsed: Record<string, any>[] = [];
      for (const raw of rawRows) {
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => {
          const key = colMap[i];
          if (key) obj[key] = raw[h];
        });
        const date = normalizeDate(obj.payment_date ?? "");
        if (!date) continue;
        parsed.push({
          installment_no: obj.installment_no ? Number(String(obj.installment_no).replace(/\D/g, "")) || null : null,
          payment_date: date,
          principal_amount: toNum(obj.principal_amount),
          interest_amount: toNum(obj.interest_amount),
          balance_after: obj.balance_after ? toNum(obj.balance_after) : null,
          entry_type: "scheduled",
        });
      }
      if (parsed.length === 0) {
        setError("取込可能な行がありません。日付の形式（YYYY-MM-DD 等）を確認してください。");
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file, "UTF-8");
  }

  async function doImport() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/loans/${loanId}/repayments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, replace }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "取込に失敗しました");
        return;
      }
      setRows([]);
      onClose();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold">償還予定表CSVを取込</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-ink-3 mb-4 leading-relaxed">
          銀行発行の返済予定表（償還予定表）をCSVで取り込めます。<br />
          ヘッダーに「返済日」「元金」「利息」「残高」を含めてください（回数は任意）。
          日付は YYYY-MM-DD / YYYY/MM/DD などに対応します。
        </p>

        {error && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-3">{error}</div>
        )}

        <input type="file" accept=".csv,text/csv" onChange={handleFile} className="block w-full text-sm mb-4" />

        {rows.length > 0 && (
          <>
            <div className="text-sm text-ink-2 mb-2">{rows.length}行を取込予定（先頭5行プレビュー）</div>
            <div className="card overflow-x-auto mb-3">
              <table className="w-full text-xs min-w-[480px]">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="text-left px-2 py-1.5">回</th>
                    <th className="text-left px-2 py-1.5">返済日</th>
                    <th className="text-right px-2 py-1.5">元金</th>
                    <th className="text-right px-2 py-1.5">利息</th>
                    <th className="text-right px-2 py-1.5">残高</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5 text-ink-3">{r.installment_no ?? "—"}</td>
                      <td className="px-2 py-1.5">{r.payment_date}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{r.principal_amount.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{r.interest_amount.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{r.balance_after != null ? r.balance_after.toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-2 mb-4">
              <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
              既存の予定表を置き換える（繰上返済行は残します）
            </label>
            <button className="btn btn-primary w-full flex items-center justify-center gap-1.5" disabled={loading} onClick={doImport}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {loading ? "取込中…" : `${rows.length}行を取り込む`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
