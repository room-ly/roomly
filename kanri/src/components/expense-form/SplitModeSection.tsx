"use client";

import { useRef, useState } from "react";

type Party = "owner" | "tenant" | "company";

const FIELDS: { key: Party; label: string; bar: string; dot: string }[] = [
  { key: "owner", label: "オーナー負担", bar: "bg-accent", dot: "bg-accent" },
  { key: "tenant", label: "入居者負担", bar: "bg-warning", dot: "bg-warning" },
  { key: "company", label: "自社負担", bar: "bg-success", dot: "bg-success" },
];

export default function SplitModeSection({
  amount,
  ownerAmount,
  setOwnerAmount,
  tenantAmount,
  setTenantAmount,
  companyAmount,
  setCompanyAmount,
  breakdownOk,
  sumBreakdown,
}: {
  amount: number;
  ownerAmount: number;
  setOwnerAmount: (v: number) => void;
  tenantAmount: number;
  setTenantAmount: (v: number) => void;
  companyAmount: number;
  setCompanyAmount: (v: number) => void;
  breakdownOk: boolean;
  sumBreakdown: number;
}) {
  // 金額入力 or 比率(%)入力の切替
  const [inputMode, setInputMode] = useState<"amount" | "ratio">("amount");
  // 比率モードでの一時的な入力値(換算前)を保持
  const [ratioState, setRatioState] = useState<Record<Party, number>>({
    owner: 0,
    tenant: 0,
    company: 0,
  });

  const valueOf = (key: Party) =>
    key === "owner" ? ownerAmount : key === "tenant" ? tenantAmount : companyAmount;
  const setterOf = (key: Party) =>
    key === "owner" ? setOwnerAmount : key === "tenant" ? setTenantAmount : setCompanyAmount;

  // そのボックスに金額を全額入れ、他を0にする
  const setFull = (key: Party) => {
    setOwnerAmount(key === "owner" ? amount : 0);
    setTenantAmount(key === "tenant" ? amount : 0);
    setCompanyAmount(key === "company" ? amount : 0);
  };

  // 比率(%)から金額を再計算する。端数は最後の項目(自社)に寄せる。
  const applyRatio = (key: Party, pct: number) => {
    const ratios: Record<Party, number> = { ...ratioState };
    ratios[key] = pct;
    const total = ratios.owner + ratios.tenant + ratios.company;
    if (total <= 0 || amount <= 0) {
      setRatioState(ratios);
      return;
    }
    const owner = Math.round((amount * ratios.owner) / total);
    const tenant = Math.round((amount * ratios.tenant) / total);
    const company = amount - owner - tenant; // 端数は自社に寄せる
    setOwnerAmount(owner);
    setTenantAmount(tenant);
    setCompanyAmount(company);
    setRatioState(ratios);
  };

  // 金額からの現在比率(表示用)
  const pctOf = (v: number) => (amount > 0 ? Math.round((v / amount) * 100) : 0);

  // ===== 積み上げバー(スライダー) =====
  // 2つの境界 b1(オーナー終端) / b2(入居者終端) を 0..1 で扱う。
  // owner = b1, tenant = b2 - b1, company = 1 - b2。
  // バー本体のどこを掴んでも、押した位置に最も近い境界を動かす方式にする。
  // (ハンドルが重なってもクリックを取りこぼさない)
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<1 | 2 | null>(null);

  const total = amount > 0 ? amount : 0;
  // 表示用の境界位置(金額ベース)。amount=0 のときは全て0幅。
  const b1 = total > 0 ? ownerAmount / total : 0;
  const b2 = total > 0 ? (ownerAmount + tenantAmount) / total : 0;

  // ドラッグ中のリスナーは登録時点のクロージャを掴むため、最新の境界をrefで参照する
  const boundsRef = useRef({ b1, b2, total });
  boundsRef.current = { b1, b2, total };

  // 境界位置(b1,b2)から金額を確定する。端数は自社に寄せる。
  const applyBoundaries = (nb1: number, nb2: number) => {
    const t = boundsRef.current.total;
    if (t <= 0) return;
    const owner = Math.round(t * nb1);
    const tenant = Math.round(t * (nb2 - nb1));
    const company = t - owner - tenant;
    setOwnerAmount(owner);
    setTenantAmount(tenant);
    setCompanyAmount(company);
  };

  const ratioFromEvent = (clientX: number) => {
    const el = barRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  // 押した位置に近い方の境界を選んで動かす
  const moveNearest = (r: number) => {
    const { b1: cb1, b2: cb2 } = boundsRef.current;
    const which = dragging.current;
    if (which === 1) {
      applyBoundaries(Math.min(r, cb2), cb2);
    } else if (which === 2) {
      applyBoundaries(cb1, Math.max(r, cb1));
    }
  };

  // add/removeEventListener が同一参照を指すよう、ハンドラを ref に固定する。
  const logicRef = useRef<{ move: (e: PointerEvent) => void; up: () => void }>({
    move: () => {},
    up: () => {},
  });
  logicRef.current.move = (e: PointerEvent) => {
    if (!dragging.current) return;
    moveNearest(ratioFromEvent(e.clientX));
  };
  logicRef.current.up = () => {
    dragging.current = null;
    window.removeEventListener("pointermove", stableMove.current);
    window.removeEventListener("pointerup", stableUp.current);
  };
  const stableMove = useRef((e: PointerEvent) => logicRef.current.move(e));
  const stableUp = useRef(() => logicRef.current.up());

  // バー本体を押したら、押下位置に近い境界を選択してドラッグ開始
  const onBarPointerDown = (e: React.PointerEvent) => {
    if (total <= 0) return;
    e.preventDefault();
    const r = ratioFromEvent(e.clientX);
    const { b1: cb1, b2: cb2 } = boundsRef.current;
    // b1 と b2 の近い方。同距離なら b1 側を優先(左寄せ)。
    dragging.current = Math.abs(r - cb1) <= Math.abs(r - cb2) ? 1 : 2;
    moveNearest(r);
    window.addEventListener("pointermove", stableMove.current);
    window.addEventListener("pointerup", stableUp.current);
  };

  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

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

      {/* 積み上げスライダー: バー上をドラッグして3者の配分を直感的に調整 */}
      <div className="mb-2">
        <div
          ref={barRef}
          onPointerDown={onBarPointerDown}
          role="group"
          aria-label="負担割合スライダー"
          className={`relative h-7 rounded-lg overflow-hidden bg-bg-2 select-none touch-none ${
            total > 0 ? "cursor-ew-resize" : "opacity-50 cursor-not-allowed"
          }`}
        >
          {/* 3色帯 */}
          <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: pct(b1) }} />
          <div
            className="absolute inset-y-0 bg-warning"
            style={{ left: pct(b1), width: pct(b2 - b1) }}
          />
          <div className="absolute inset-y-0 right-0 bg-success" style={{ left: pct(b2) }} />

          {/* 帯内の%ラベル(幅が十分なときだけ) */}
          {b1 > 0.12 && (
            <span
              className="absolute inset-y-0 left-0 flex items-center justify-center text-[10px] font-medium text-white pointer-events-none"
              style={{ width: pct(b1) }}
            >
              {Math.round(b1 * 100)}%
            </span>
          )}
          {b2 - b1 > 0.12 && (
            <span
              className="absolute inset-y-0 flex items-center justify-center text-[10px] font-medium text-white pointer-events-none"
              style={{ left: pct(b1), width: pct(b2 - b1) }}
            >
              {Math.round((b2 - b1) * 100)}%
            </span>
          )}
          {1 - b2 > 0.12 && (
            <span
              className="absolute inset-y-0 right-0 flex items-center justify-center text-[10px] font-medium text-white pointer-events-none"
              style={{ left: pct(b2) }}
            >
              {Math.round((1 - b2) * 100)}%
            </span>
          )}

          {/* ハンドル(視覚表示のみ。ドラッグはバー全体で受ける) */}
          {total > 0 && (
            <>
              <div
                className="absolute top-0 bottom-0 -ml-1.5 w-3 flex items-center justify-center pointer-events-none"
                style={{ left: pct(b1) }}
              >
                <div className="w-1 h-5 rounded-full bg-white shadow ring-1 ring-black/10" />
              </div>
              <div
                className="absolute top-0 bottom-0 -ml-1.5 w-3 flex items-center justify-center pointer-events-none"
                style={{ left: pct(b2) }}
              >
                <div className="w-1 h-5 rounded-full bg-white shadow ring-1 ring-black/10" />
              </div>
            </>
          )}
        </div>
        {/* 凡例 */}
        <div className="flex items-center gap-3 mt-1 text-[10px] text-ink-3">
          {FIELDS.map(({ key, label, dot }) => (
            <span key={key} className="flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-sm ${dot}`} />
              {label.replace("負担", "")} ¥{valueOf(key).toLocaleString()}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-ink-3">{label}</label>
              <button
                type="button"
                onClick={() => setFull(key)}
                className="text-[10px] text-accent hover:underline"
                title="この区分に全額を割り当てる"
              >
                100%
              </button>
            </div>
            {inputMode === "amount" ? (
              <input
                type="number"
                value={valueOf(key) || 0}
                onChange={(e) => setterOf(key)(Number(e.target.value) || 0)}
                className="input"
              />
            ) : (
              <div className="relative">
                <input
                  type="number"
                  value={ratioState[key] || pctOf(valueOf(key)) || 0}
                  onChange={(e) => applyRatio(key, Number(e.target.value) || 0)}
                  className="input pr-6"
                  min={0}
                  max={100}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-3 pointer-events-none">
                  %
                </span>
              </div>
            )}
            {inputMode === "ratio" && (
              <p className="text-[10px] text-ink-3 mt-0.5">¥{valueOf(key).toLocaleString()}</p>
            )}
          </div>
        ))}
      </div>

      <p className={`text-[11px] mt-1 ${breakdownOk ? "text-ink-3" : "text-danger"}`}>
        内訳合計: ¥{sumBreakdown.toLocaleString()} / 金額: ¥{amount.toLocaleString()}
        {!breakdownOk && " — 一致しません"}
      </p>
    </div>
  );
}
