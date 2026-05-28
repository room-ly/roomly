"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface OwnerSummary {
  id: string;
  name: string;
  netAmount: number;
}

interface ZenginCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  remittances: Record<string, any>[];
  ownerSummaries: OwnerSummary[];
}

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

export default function ZenginCsvModal({ isOpen, onClose, remittances, ownerSummaries }: ZenginCsvModalProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<Set<string>>(new Set());
  const [selectedRemittanceIds, setSelectedRemittanceIds] = useState<Set<string>>(new Set());
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"summary" | "history">("summary");

  const confirmedRemittances = remittances.filter(
    (r) => r.status === "confirmed" || r.status === "draft"
  );
  const hasHistory = confirmedRemittances.length > 0;

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/bank-accounts")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setBankAccounts(data);
        const def = data.find((a: BankAccount) => a.is_default);
        if (def) setSelectedAccountId(def.id);
        else if (data.length > 0) setSelectedAccountId(data[0].id);
      })
      .catch(() => {});
    setSelectedOwnerIds(new Set());
    setSelectedRemittanceIds(new Set());
    setError("");
    setMode(hasHistory ? "history" : "summary");
  }, [isOpen, hasHistory]);

  if (!isOpen) return null;

  const selectedAccount = bankAccounts.find((a) => a.id === selectedAccountId);

  const toggleAllOwners = () => {
    if (selectedOwnerIds.size === ownerSummaries.length) {
      setSelectedOwnerIds(new Set());
    } else {
      setSelectedOwnerIds(new Set(ownerSummaries.map((o) => o.id)));
    }
  };

  const toggleOwner = (id: string) => {
    const next = new Set(selectedOwnerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOwnerIds(next);
  };

  const toggleAllRemittances = () => {
    if (selectedRemittanceIds.size === confirmedRemittances.length) {
      setSelectedRemittanceIds(new Set());
    } else {
      setSelectedRemittanceIds(new Set(confirmedRemittances.map((r) => r.id)));
    }
  };

  const toggleRemittance = (id: string) => {
    const next = new Set(selectedRemittanceIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRemittanceIds(next);
  };

  const selectedCount = mode === "summary" ? selectedOwnerIds.size : selectedRemittanceIds.size;

  const totalAmount = mode === "summary"
    ? ownerSummaries.filter((o) => selectedOwnerIds.has(o.id)).reduce((s, o) => s + o.netAmount, 0)
    : confirmedRemittances.filter((r) => selectedRemittanceIds.has(r.id)).reduce((s, r) => s + Number(r.net_amount), 0);

  const handleDownload = async () => {
    if (selectedCount === 0) {
      setError("1件以上選択してください");
      return;
    }
    if (!selectedAccount) {
      setError("振込元口座を選択してください。設定画面で口座を登録できます。");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body: Record<string, any> = {
        transfer_date: transferDate,
        sender_name: selectedAccount.account_holder,
        sender_bank_code: selectedAccount.bank_code,
        sender_branch_code: selectedAccount.branch_code,
        sender_account_type: selectedAccount.account_type,
        sender_account_number: selectedAccount.account_number,
      };

      if (mode === "history") {
        body.remittance_ids = Array.from(selectedRemittanceIds);
      } else {
        body.owner_ids = Array.from(selectedOwnerIds);
        const amounts: Record<string, number> = {};
        ownerSummaries.filter((o) => selectedOwnerIds.has(o.id)).forEach((o) => {
          amounts[o.id] = o.netAmount;
        });
        body.owner_amounts = amounts;
      }

      const res = await fetch("/api/remittances/zengin-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "CSVの生成に失敗しました");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zengin_${transferDate}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold">全銀フォーマット エクスポート</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="bg-danger-tint text-danger text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* 振込元口座 */}
          <div>
            <h3 className="text-[13px] font-semibold text-ink-2 mb-3">振込元口座</h3>
            {bankAccounts.length === 0 ? (
              <p className="text-[13px] text-ink-3 bg-bg-2 rounded-lg px-4 py-3">
                口座が登録されていません。<a href="/settings" className="text-accent hover:underline">設定画面</a>から口座を追加してください。
              </p>
            ) : (
              <div className="space-y-3">
                <select
                  className="input"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.bank_name} {a.branch_name} {a.account_number}
                    </option>
                  ))}
                </select>
                {selectedAccount && (
                  <div className="bg-bg-2 rounded-lg p-3 text-[12px] text-ink-2 space-y-0.5">
                    <div>{selectedAccount.bank_name}（{selectedAccount.bank_code}）{selectedAccount.branch_name}（{selectedAccount.branch_code}）</div>
                    <div>{selectedAccount.account_type === "2" ? "当座" : "普通"} {selectedAccount.account_number} {selectedAccount.account_holder}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 振込指定日 */}
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">振込指定日</label>
            <input
              type="date"
              className="input"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />
          </div>

          {/* モード切替 */}
          {hasHistory && (
            <div className="flex gap-1 bg-bg-2 rounded-lg p-1">
              <button
                type="button"
                className={`flex-1 text-[12px] py-1.5 rounded-md transition-colors ${mode === "summary" ? "bg-surface shadow-sm font-medium" : "text-ink-3 hover:text-ink-2"}`}
                onClick={() => setMode("summary")}
              >
                現在のサマリーから
              </button>
              <button
                type="button"
                className={`flex-1 text-[12px] py-1.5 rounded-md transition-colors ${mode === "history" ? "bg-surface shadow-sm font-medium" : "text-ink-3 hover:text-ink-2"}`}
                onClick={() => setMode("history")}
              >
                送金履歴から
              </button>
            </div>
          )}

          {/* 送金先選択 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[13px] font-semibold text-ink-2">振込先選択</h3>
              {mode === "summary" && ownerSummaries.length > 0 && (
                <button type="button" className="text-[11px] text-accent hover:underline" onClick={toggleAllOwners}>
                  {selectedOwnerIds.size === ownerSummaries.length ? "すべて解除" : "すべて選択"}
                </button>
              )}
              {mode === "history" && confirmedRemittances.length > 0 && (
                <button type="button" className="text-[11px] text-accent hover:underline" onClick={toggleAllRemittances}>
                  {selectedRemittanceIds.size === confirmedRemittances.length ? "すべて解除" : "すべて選択"}
                </button>
              )}
            </div>

            {mode === "summary" ? (
              ownerSummaries.length === 0 ? (
                <p className="text-[13px] text-ink-3 bg-bg-2 rounded-lg px-4 py-3">オーナーが登録されていません</p>
              ) : (
                <div className="border border-line rounded-lg overflow-hidden">
                  {ownerSummaries.filter((o) => o.netAmount > 0).map((o, i, arr) => (
                    <label
                      key={o.id}
                      className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-bg-2/50 ${
                        i < arr.length - 1 ? "border-b border-line" : ""
                      } ${selectedOwnerIds.has(o.id) ? "bg-accent/5" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOwnerIds.has(o.id)}
                        onChange={() => toggleOwner(o.id)}
                        className="rounded border-line"
                      />
                      <span className="flex-1 text-[13px]">{o.name}</span>
                      <span className="text-[13px] font-medium tabular-nums">
                        ¥{o.netAmount.toLocaleString()}
                      </span>
                    </label>
                  ))}
                </div>
              )
            ) : (
              confirmedRemittances.length === 0 ? (
                <p className="text-[13px] text-ink-3 bg-bg-2 rounded-lg px-4 py-3">出力可能な送金データがありません（下書き・確定済みが対象）</p>
              ) : (
                <div className="border border-line rounded-lg overflow-hidden">
                  {confirmedRemittances.map((r, i) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-bg-2/50 ${
                        i < confirmedRemittances.length - 1 ? "border-b border-line" : ""
                      } ${selectedRemittanceIds.has(r.id) ? "bg-accent/5" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRemittanceIds.has(r.id)}
                        onChange={() => toggleRemittance(r.id)}
                        className="rounded border-line"
                      />
                      <span className="flex-1 text-[13px]">
                        {r.owner?.name || "—"} — {r.remittance_month?.slice(0, 7)}
                      </span>
                      <span className="text-[13px] font-medium tabular-nums">
                        ¥{Number(r.net_amount).toLocaleString()}
                      </span>
                    </label>
                  ))}
                </div>
              )
            )}
          </div>

          {selectedCount > 0 && (
            <div className="text-right text-[14px] font-semibold tabular-nums">
              合計: ¥{totalAmount.toLocaleString()}（{selectedCount}件）
            </div>
          )}
        </div>

        <p className="text-[11px] text-ink-3 mt-4">
          ※ 全銀協標準フォーマット（固定長120バイト）で出力されます。銀行独自のCSV形式が必要な場合は<a href="mailto:contact@roomly.jp" className="text-accent hover:underline">お問い合わせ</a>ください。
        </p>

        <div className="flex justify-end gap-2 pt-5 mt-5 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="bg-bg-2 text-ink-2 rounded-lg px-4 py-2 text-sm hover:bg-bg-2/80 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleDownload}
            disabled={loading || selectedCount === 0 || bankAccounts.length === 0}
            className="btn btn-primary disabled:opacity-50 flex items-center gap-1.5"
          >
            <Download size={14} />
            {loading ? "生成中..." : "ダウンロード"}
          </button>
        </div>
      </div>
    </div>
  );
}
