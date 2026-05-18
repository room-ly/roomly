"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BANK_CODES } from "@/lib/bank-codes";

interface BankSuggestProps {
  nameValue: string;
  codeValue: string;
  onNameChange: (name: string) => void;
  onCodeChange: (code: string) => void;
  branchNameValue?: string;
  branchCodeValue?: string;
  onBranchNameChange?: (name: string) => void;
  onBranchCodeChange?: (code: string) => void;
  nameName?: string;
  codeName?: string;
  branchNameName?: string;
  branchCodeName?: string;
  required?: boolean;
  showBranch?: boolean;
}

interface Branch {
  code: string;
  name: string;
  kana: string;
}

export default function BankSuggest({
  nameValue,
  codeValue,
  onNameChange,
  onCodeChange,
  branchNameValue = "",
  branchCodeValue = "",
  onBranchNameChange,
  onBranchCodeChange,
  nameName = "bank_name",
  codeName = "bank_code",
  branchNameName = "bank_branch",
  branchCodeName = "bank_branch_code",
  required = false,
  showBranch = true,
}: BankSuggestProps) {
  const [bankOpen, setBankOpen] = useState(false);
  const [bankFiltered, setBankFiltered] = useState<typeof BANK_CODES[number][]>([]);
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchFiltered, setBranchFiltered] = useState<Branch[]>([]);
  const bankRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bankRef.current && !bankRef.current.contains(e.target as Node)) setBankOpen(false);
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) setBranchOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleBankInput(val: string) {
    onNameChange(val);
    if (!val.trim()) { setBankOpen(false); return; }
    const q = val.trim().toLowerCase();
    const results = BANK_CODES.filter(
      (b) => b.name.toLowerCase().includes(q) || b.kana.toLowerCase().includes(q) || b.code.includes(q)
    ).slice(0, 8);
    setBankFiltered(results);
    setBankOpen(results.length > 0);
  }

  function selectBank(bank: typeof BANK_CODES[number]) {
    onNameChange(bank.name);
    onCodeChange(bank.code);
    setBankOpen(false);
  }

  const fetchBranches = useCallback(async (bankCode: string, query: string) => {
    if (!bankCode || bankCode.length < 4) { setBranchOpen(false); return; }
    try {
      const res = await fetch(`/api/bank-branches?bank=${bankCode}&q=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      const data: Branch[] = await res.json();
      setBranchFiltered(data);
      setBranchOpen(data.length > 0);
    } catch {
      setBranchOpen(false);
    }
  }, []);

  function handleBranchInput(val: string) {
    onBranchNameChange?.(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchBranches(codeValue, val);
    }, 200);
  }

  function selectBranch(branch: Branch) {
    onBranchNameChange?.(branch.name);
    onBranchCodeChange?.(branch.code);
    setBranchOpen(false);
  }

  return (
    <div className="space-y-3">
      {/* 銀行 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative" ref={bankRef}>
          <label className="text-sm font-medium text-ink-2 block mb-1">
            銀行名 {required && <span className="text-danger">*</span>}
          </label>
          <input
            name={nameName}
            type="text"
            className="input"
            value={nameValue}
            onChange={(e) => handleBankInput(e.target.value)}
            onFocus={() => { if (nameValue.trim()) handleBankInput(nameValue); }}
            placeholder="例: 三菱UFJ銀行"
            autoComplete="off"
            required={required}
          />
          {bankOpen && bankFiltered.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-line rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {bankFiltered.map((b) => (
                <button
                  key={b.code}
                  type="button"
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-bg-2 transition-colors flex items-center justify-between"
                  onMouseDown={(e) => { e.preventDefault(); selectBank(b); }}
                >
                  <span>{b.name}</span>
                  <span className="text-[11px] text-ink-3 tabular-nums">{b.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-ink-2 block mb-1">
            銀行コード {required && <span className="text-danger">*</span>}
          </label>
          <input
            name={codeName}
            type="text"
            className="input tabular-nums"
            value={codeValue}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="例: 0005"
            maxLength={4}
            required={required}
          />
        </div>
      </div>

      {/* 支店 */}
      {showBranch && (
        <div className="grid grid-cols-2 gap-2">
          <div className="relative" ref={branchRef}>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              支店名 {required && <span className="text-danger">*</span>}
            </label>
            <input
              name={branchNameName}
              type="text"
              className="input"
              value={branchNameValue}
              onChange={(e) => handleBranchInput(e.target.value)}
              placeholder={codeValue.length >= 4 ? "支店名を入力で候補表示" : "先に銀行を選択"}
              autoComplete="off"
              required={required}
            />
            {branchOpen && branchFiltered.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-line rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {branchFiltered.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    className="w-full text-left px-3 py-2 text-[13px] hover:bg-bg-2 transition-colors flex items-center justify-between"
                    onMouseDown={(e) => { e.preventDefault(); selectBranch(b); }}
                  >
                    <span>{b.name}</span>
                    <span className="text-[11px] text-ink-3 tabular-nums">{b.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-ink-2 block mb-1">
              支店コード {required && <span className="text-danger">*</span>}
            </label>
            <input
              name={branchCodeName}
              type="text"
              className="input tabular-nums"
              value={branchCodeValue}
              onChange={(e) => onBranchCodeChange?.(e.target.value)}
              placeholder="例: 259"
              maxLength={3}
              required={required}
            />
          </div>
        </div>
      )}
    </div>
  );
}
