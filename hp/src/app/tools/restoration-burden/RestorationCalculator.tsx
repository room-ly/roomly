"use client";

import { useState, useMemo } from "react";
import { useToolLog } from "@/lib/use-tool-log";

type ItemKey =
  | "wallpaper"
  | "cushion_floor"
  | "carpet"
  | "flooring"
  | "tatami_omote"
  | "sink"
  | "aircon"
  | "equipment_general";

type FaultType = "tenant" | "shared" | "landlord";

interface ItemMeta {
  key: ItemKey;
  label: string;
  usefulYears: number | null;
  note: string;
}

const ITEMS: ItemMeta[] = [
  { key: "wallpaper", label: "壁紙（クロス）", usefulYears: 6, note: "国交省ガイドラインで耐用年数6年" },
  { key: "cushion_floor", label: "クッションフロア", usefulYears: 6, note: "耐用年数6年" },
  { key: "carpet", label: "カーペット", usefulYears: 6, note: "耐用年数6年" },
  { key: "flooring", label: "フローリング", usefulYears: null, note: "部分補修は経過年数を考慮しない（全面張替えは建物耐用年数）" },
  { key: "tatami_omote", label: "畳表", usefulYears: null, note: "経過年数を考慮しない（消耗品扱い）" },
  { key: "sink", label: "流し台", usefulYears: 5, note: "耐用年数5年" },
  { key: "aircon", label: "エアコン", usefulYears: 6, note: "耐用年数6年" },
  { key: "equipment_general", label: "電気・ガス・水道設備", usefulYears: 15, note: "耐用年数15年" },
];

const FAULT_OPTIONS: { value: FaultType; label: string; description: string }[] = [
  { value: "tenant", label: "入居者の故意・過失", description: "タバコのヤニ、飲み物のシミ、引越し時の傷など" },
  { value: "shared", label: "通常の使用 + 善管注意義務違反", description: "結露を放置したカビなど、入居者の管理不足が含まれる" },
  { value: "landlord", label: "通常損耗・経年変化のみ", description: "家具のへこみ、日焼けによる変色など、入居者責任ではない" },
];

const yen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;

export default function RestorationCalculator() {
  const [itemKey, setItemKey] = useState<ItemKey>("wallpaper");
  const [residencyMonths, setResidencyMonths] = useState(36);
  const [repairCost, setRepairCost] = useState(50000);
  const [faultType, setFaultType] = useState<FaultType>("tenant");

  const item = ITEMS.find((i) => i.key === itemKey)!;

  const result = useMemo(() => {
    if (faultType === "landlord") {
      return {
        tenantBurden: 0,
        landlordBurden: repairCost,
        tenantRatio: 0,
        residencyYears: residencyMonths / 12,
        reason: "通常損耗・経年変化は大家負担です。家賃に減価分が含まれているという考え方が根拠です。",
      };
    }

    const residencyYears = residencyMonths / 12;

    if (item.usefulYears === null) {
      const tenantRatio = faultType === "tenant" ? 1.0 : 0.5;
      const tenantBurden = Math.max(repairCost * tenantRatio, 1);
      return {
        tenantBurden,
        landlordBurden: repairCost - tenantBurden,
        tenantRatio,
        residencyYears,
        reason: `${item.label}は経過年数を考慮しない品目です（${item.note}）。入居者の責任割合がそのまま負担割合になります。`,
      };
    }

    const remainingRatio = Math.max(
      (item.usefulYears - residencyYears) / item.usefulYears,
      0
    );
    const baseTenantRatio = faultType === "tenant" ? 1.0 : 0.5;
    const adjustedRatio = Math.max(remainingRatio * baseTenantRatio, 0);
    const tenantBurdenRaw = repairCost * adjustedRatio;
    const tenantBurden = tenantBurdenRaw < 1 ? 1 : tenantBurdenRaw;

    return {
      tenantBurden,
      landlordBurden: Math.max(repairCost - tenantBurden, 0),
      tenantRatio: adjustedRatio,
      residencyYears,
      reason:
        residencyYears >= item.usefulYears
          ? `入居期間（${residencyYears.toFixed(1)}年）が耐用年数（${item.usefulYears}年）を超えているため、入居者負担は1円（記録上の最小額）になります。`
          : `耐用年数${item.usefulYears}年に対し入居期間${residencyYears.toFixed(1)}年。残存価値${(remainingRatio * 100).toFixed(0)}%に責任割合${(baseTenantRatio * 100).toFixed(0)}%を乗じて負担割合を算出しました。`,
    };
  }, [itemKey, residencyMonths, repairCost, faultType, item]);

  useToolLog(
    "restoration-burden",
    { itemKey, residencyMonths, repairCost, faultType },
    {
      tenantBurden: result.tenantBurden,
      landlordBurden: result.landlordBurden,
      tenantRatio: result.tenantRatio,
    }
  );

  return (
    <div className="rounded-2xl border border-rm-border bg-rm-surface p-6 sm:p-8">
      <div className="space-y-5">
        <div>
          <label className="block text-[13px] font-medium text-rm-primary">
            損耗箇所
          </label>
          <select
            value={itemKey}
            onChange={(e) => setItemKey(e.target.value as ItemKey)}
            className="mt-2 w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
          >
            {ITEMS.map((it) => (
              <option key={it.key} value={it.key}>
                {it.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] text-rm-text-muted">{item.note}</p>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-rm-primary">
            入居期間
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={360}
              value={residencyMonths}
              onChange={(e) => setResidencyMonths(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
            />
            <span className="whitespace-nowrap text-[13px] text-rm-text-muted">
              ヶ月（{(residencyMonths / 12).toFixed(1)}年）
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={120}
            value={residencyMonths}
            onChange={(e) => setResidencyMonths(Number(e.target.value))}
            className="mt-3 w-full accent-rm-accent-deep"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-rm-primary">
            補修費用の見積もり
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              step={1000}
              value={repairCost}
              onChange={(e) => setRepairCost(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
            />
            <span className="text-[13px] text-rm-text-muted">円</span>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-rm-primary">
            損耗の原因
          </label>
          <div className="mt-2 space-y-2">
            {FAULT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                  faultType === opt.value
                    ? "border-rm-accent-deep bg-rm-accent-tint/40"
                    : "border-rm-border bg-rm-bg hover:border-rm-border-strong"
                }`}
              >
                <input
                  type="radio"
                  name="faultType"
                  value={opt.value}
                  checked={faultType === opt.value}
                  onChange={() => setFaultType(opt.value)}
                  className="mt-1 accent-rm-accent-deep"
                />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-rm-primary">{opt.label}</p>
                  <p className="mt-1 text-[12px] text-rm-text-muted">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-rm-primary p-6 text-rm-bg">
          <p className="text-[12px] uppercase tracking-wider text-rm-bg/60">入居者負担</p>
          <p className="mt-2 text-[26px] font-medium tracking-tight">
            {yen(result.tenantBurden)}
          </p>
          <p className="mt-2 text-[11px] text-rm-bg/60">
            負担割合 {(result.tenantRatio * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-rm-border bg-rm-bg p-6">
          <p className="text-[12px] uppercase tracking-wider text-rm-text-muted">大家負担</p>
          <p className="mt-2 text-[26px] font-medium tracking-tight text-rm-primary">
            {yen(result.landlordBurden)}
          </p>
          <p className="mt-2 text-[11px] text-rm-text-muted">
            負担割合 {((1 - result.tenantRatio) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-rm-border bg-rm-bg p-4 text-[12px] leading-relaxed text-rm-text-muted">
        <p className="font-medium text-rm-text-secondary">計算の根拠</p>
        <p className="mt-2">{result.reason}</p>
      </div>

      <div className="mt-4 rounded-lg border border-rm-border bg-rm-bg p-4 text-[12px] leading-relaxed text-rm-text-muted">
        <p className="font-medium text-rm-text-secondary">この計算の前提</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>国土交通省「原状回復をめぐるトラブルとガイドライン」（再改訂版）の耐用年数表に基づきます</li>
          <li>「通常の使用 + 善管注意義務違反」は入居者責任を50%として概算しています（実際の判定はケースバイケース）</li>
          <li>入居期間が耐用年数を超える場合、入居者負担は1円とします（責任の記録目的）</li>
          <li>畳表・フローリング部分補修・ハウスクリーニング等の「経過年数を考慮しない」品目は別途扱いです</li>
          <li>本ツールは判断補助です。最終的な精算は退去立会いと書面合意で確定させてください</li>
        </ul>
      </div>
    </div>
  );
}
