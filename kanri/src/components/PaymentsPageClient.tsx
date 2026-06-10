"use client";

import { useState, useEffect } from "react";
import { Download, CheckSquare, Square } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  repair: "修繕費",
  cleaning: "清掃費",
  insurance: "保険料",
  tax: "税金",
  utility: "光熱費",
  other: "その他",
};

interface BankAccount {
  id: string;
  label: string;
  bank_name: string;
  bank_code: string;
  branch_name: string;
  branch_code: string;
  account_type: string;
  account_number: string;
  account_holder: string;
  is_default: boolean;
}

interface PaymentsPageClientProps {
  remittances: Record<string, any>[];
  expenses: Record<string, any>[];
}

export default function PaymentsPageClient({ remittances, expenses }: PaymentsPageClientProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedRemittanceIds, setSelectedRemittanceIds] = useState<Set<string>>(new Set());
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skipped, setSkipped] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setBankAccounts(data);
        const def = data.find((a: BankAccount) => a.is_default);
        setSelectedAccountId(def ? def.id : data[0]?.id ?? "");
      })
      .catch(() => {});
  }, []);

  const selectedAccount = bankAccounts.find((a) => a.id === selectedAccountId);

  const toggleRemittance = (id: string) => {
    setSelectedRemittanceIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpense = (id: string) => {
    setSelectedExpenseIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllRemittances = () => {
    setSelectedRemittanceIds(
      selectedRemittanceIds.size === remittances.length
        ? new Set()
        : new Set(remittances.map((r) => r.id))
    );
  };

  const toggleAllExpenses = () => {
    setSelectedExpenseIds(
      selectedExpenseIds.size === expenses.length
        ? new Set()
        : new Set(expenses.map((e) => e.id))
    );
  };

  const totalSelected = selectedRemittanceIds.size + selectedExpenseIds.size;

  const totalAmount = [
    ...remittances.filter((r) => selectedRemittanceIds.has(r.id)).map((r) => Number(r.net_amount)),
    ...expenses.filter((e) => selectedExpenseIds.has(e.id)).map((e) => Number(e.amount)),
  ].reduce((a, b) => a + b, 0);

  async function handleExport() {
    if (totalSelected === 0) {
      setError("1件以上選択してください");
      return;
    }
    setError("");
    setSkipped([]);
    setLoading(true);

    try {
      const res = await fetch("/api/payments/zengin-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remittance_ids: Array.from(selectedRemittanceIds),
          expense_ids: Array.from(selectedExpenseIds),
          transfer_date: transferDate,
          sender_name: selectedAccount?.account_holder ?? "",
          sender_bank_code: selectedAccount?.bank_code ?? "",
          sender_branch_code: selectedAccount?.branch_code ?? "",
          sender_account_type: selectedAccount?.account_type ?? "",
          sender_account_number: selectedAccount?.account_number ?? "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "エラーが発生しました");
        if (err.skipped) setSkipped(err.skipped);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zengin_${transferDate}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("ダウンロードに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 送信元口座・振込日 */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-ink-2">送信元口座・振込日</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-ink-3 block mb-1">送信元口座</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="input"
            >
              {bankAccounts.length === 0 && <option value="">（口座未登録）</option>}
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-3 block mb-1">振込日</label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* オーナー送金 */}
      {remittances.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2">
            <div className="flex items-center gap-2">
              <button onClick={toggleAllRemittances} className="text-ink-3 hover:text-accent transition-colors">
                {selectedRemittanceIds.size === remittances.length
                  ? <CheckSquare size={16} />
                  : <Square size={16} />}
              </button>
              <span className="text-sm font-semibold">オーナー送金</span>
              <span className="text-xs text-ink-3">{selectedRemittanceIds.size}/{remittances.length}件選択</span>
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <tbody className="divide-y divide-border">
              {remittances.map((r) => {
                const owner = r.owner as Record<string, any> | null;
                const hasBank = owner?.bank_code && owner?.bank_account_number;
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-surface-2 transition-colors cursor-pointer ${!hasBank ? "opacity-50" : ""}`}
                    onClick={() => hasBank && toggleRemittance(r.id)}
                  >
                    <td className="px-4 py-3 w-8">
                      <button className="text-ink-3 hover:text-accent transition-colors" disabled={!hasBank}>
                        {selectedRemittanceIds.has(r.id) ? <CheckSquare size={15} className="text-accent" /> : <Square size={15} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{owner?.name ?? "—"}</span>
                      {!hasBank && <span className="text-xs text-danger ml-2">口座情報なし</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-2">{r.remittance_month?.slice(0, 7) ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      ¥{Number(r.net_amount).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* 費用支払い */}
      {expenses.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2">
            <div className="flex items-center gap-2">
              <button onClick={toggleAllExpenses} className="text-ink-3 hover:text-accent transition-colors">
                {selectedExpenseIds.size === expenses.length
                  ? <CheckSquare size={16} />
                  : <Square size={16} />}
              </button>
              <span className="text-sm font-semibold">業者への費用支払い</span>
              <span className="text-xs text-ink-3">{selectedExpenseIds.size}/{expenses.length}件選択</span>
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <tbody className="divide-y divide-border">
              {expenses.map((e) => {
                const payee = e.payee as Record<string, any> | null;
                const hasBank = payee?.bank_code && payee?.account_number && payee?.account_holder_kana;
                return (
                  <tr
                    key={e.id}
                    className={`hover:bg-surface-2 transition-colors cursor-pointer ${!hasBank ? "opacity-50" : ""}`}
                    onClick={() => hasBank && toggleExpense(e.id)}
                  >
                    <td className="px-4 py-3 w-8">
                      <button className="text-ink-3 hover:text-accent transition-colors" disabled={!hasBank}>
                        {selectedExpenseIds.has(e.id) ? <CheckSquare size={15} className="text-accent" /> : <Square size={15} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{e.description}</span>
                      <span className="text-xs text-ink-3 ml-2">{CATEGORY_LABEL[e.category] ?? e.category}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {payee?.name ?? "—"}
                      {!hasBank && <span className="text-xs text-danger ml-2">口座情報なし</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-2">{e.expense_date}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      ¥{Number(e.amount).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {remittances.length === 0 && expenses.length === 0 && (
        <div className="card p-10 text-center text-ink-3">
          出力対象の支払いデータがありません。<br />
          費用支払いに出すには、支払先を設定し・承認済みで・未払い（支払日が空）・「管理会社が支払う」の費用である必要があります。<br />
          オーナー送金を出すには、送金を確定してください。
        </div>
      )}

      {/* フッター */}
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="text-sm text-ink-2">
          {totalSelected > 0 ? (
            <>
              <span className="font-semibold">{totalSelected}件</span> 選択中 /
              合計 <span className="font-semibold">¥{totalAmount.toLocaleString()}</span>
            </>
          ) : (
            <span className="text-ink-3">支払いを選択してください</span>
          )}
        </div>
        <div className="space-y-1">
          {error && <p className="text-danger text-sm">{error}</p>}
          {skipped.length > 0 && (
            <ul className="text-xs text-warning space-y-0.5">
              {skipped.map((s, i) => <li key={i}>スキップ: {s}</li>)}
            </ul>
          )}
          <button
            onClick={handleExport}
            disabled={loading || totalSelected === 0}
            className="btn btn-primary disabled:opacity-50 flex items-center gap-2"
          >
            <Download size={14} />
            {loading ? "生成中…" : "全銀CSVをダウンロード"}
          </button>
        </div>
      </div>
    </div>
  );
}
