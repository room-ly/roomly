"use client";

import { useState } from "react";

type Party = "owner" | "company";

// 負担はオーナー/自社の2軸。入居者負担は敷金口座(契約)側で扱うため経費フォームには出さない。
const FIELDS: {
  key: Party;
  label: string;
  short: string;
  color: string; // CSS変数(帯色・スライダーのアクセント色 共通)
}[] = [
  { key: "owner", label: "オーナー負担", short: "オーナー", color: "var(--accent)" },
  { key: "company", label: "自社負担", short: "自社", color: "var(--info)" },
];

export default function SplitModeSection({
  amount,
  ownerAmount,
  setOwnerAmount,
  companyAmount,
  setCompanyAmount,
  breakdownOk,
  sumBreakdown,
}: {
  amount: number;
  ownerAmount: number;
  setOwnerAmount: (v: number) => void;
  companyAmount: number;
  setCompanyAmount: (v: number) => void;
  breakdownOk: boolean;
  sumBreakdown: number;
}) {
  // 金額入力 or 比率(%)入力の切替
  const [inputMode, setInputMode] = useState<"amount" | "ratio">("amount");

  const valueOf = (key: Party) => (key === "owner" ? ownerAmount : companyAmount);
  const total = amount > 0 ? amount : 0;

  // そのボックスに金額を全額入れ、他を0にする
  const setFull = (key: Party) => {
    setOwnerAmount(key === "owner" ? total : 0);
    setCompanyAmount(key === "company" ? total : 0);
  };

  // 1つの区分だけを更新する（他は動かさない）。合計が金額とズレたら下の表示が赤字で知らせる。
  const setOne = (key: Party, newVal: number) => {
    const v = Math.max(0, Math.round(newVal));
    (key === "owner" ? setOwnerAmount : setCompanyAmount)(v);
  };

  // 比率(%)入力 → その区分の金額だけを更新する。
  const applyRatio = (key: Party, pct: number) => {
    if (total <= 0) return;
    const p = Math.min(100, Math.max(0, pct));
    setOne(key, Math.round((total * p) / 100));
  };

  const pctOf = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-ink-2">負担区分</label>
        <div className="flex rounded-md border border-line overflow-hidden text-[11px]">
          {(["amount", "ratio"] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setInputMode(m)}
              className={`px-2.5 py-1 font-medium transition-colors ${
                inputMode === m ? "bg-accent text-white" : "bg-surface text-ink-3 hover:bg-bg-2"
              }`}
            >
              {m === "amount" ? "金額" : "比率(%)"}
            </button>
          ))}
        </div>
      </div>

      {/* 視覚確認用の積み上げバー(表示のみ) */}
      <div
        className={`relative flex h-2 rounded-full overflow-hidden bg-bg-2 mb-2 ${
          total > 0 ? "" : "opacity-40"
        }`}
        aria-hidden
      >
        {FIELDS.map(({ key, color }) => (
          <div
            key={key}
            style={{
              width: `${total > 0 ? (valueOf(key) / total) * 100 : 0}%`,
              backgroundColor: color,
            }}
          />
        ))}
      </div>

      {/* オーナー/自社のスライダー行 */}
      <div className="space-y-2.5">
        {FIELDS.map(({ key, label, short, color }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 w-20 shrink-0">
              <span
                className="inline-block w-2 h-2 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] text-ink-2">{short}</span>
            </div>
            <input
              type="range"
              min={0}
              max={total > 0 ? total : 100}
              step={1}
              value={valueOf(key)}
              disabled={total <= 0}
              onChange={(e) => setOne(key, Number(e.target.value))}
              aria-label={`${label}の割合`}
              className="split-range flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              style={
                {
                  "--range-color": color,
                  "--range-fill": `${
                    total > 0 ? Math.min(100, (valueOf(key) / total) * 100) : 0
                  }%`,
                } as React.CSSProperties
              }
            />
            {inputMode === "amount" ? (
              <div className="relative w-28 shrink-0">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-3 pointer-events-none">
                  ¥
                </span>
                <input
                  type="number"
                  value={valueOf(key) || 0}
                  onChange={(e) => setOne(key, Number(e.target.value) || 0)}
                  className="input pl-5 text-right"
                />
              </div>
            ) : (
              <div className="relative w-28 shrink-0">
                <input
                  type="number"
                  value={pctOf(valueOf(key))}
                  onChange={(e) => applyRatio(key, Number(e.target.value) || 0)}
                  className="input pr-6 text-right"
                  min={0}
                  max={100}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-3 pointer-events-none">
                  %
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setFull(key)}
              disabled={total <= 0}
              className="text-[10px] text-accent hover:underline shrink-0 disabled:opacity-40 disabled:no-underline"
              title="この区分に全額を割り当てる"
            >
              100%
            </button>
          </div>
        ))}
      </div>

      <p className={`text-[11px] mt-2 ${breakdownOk ? "text-ink-3" : "text-danger"}`}>
        内訳合計: ¥{sumBreakdown.toLocaleString()} / 金額: ¥{amount.toLocaleString()}
        {!breakdownOk && " — 一致しません"}
      </p>
      <p className="text-[10px] text-ink-3 mt-1">
        入居者負担分（退去時の原状回復費など）は契約の敷金から精算します。
      </p>
    </div>
  );
}
