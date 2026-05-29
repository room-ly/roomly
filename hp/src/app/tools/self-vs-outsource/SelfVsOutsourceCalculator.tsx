"use client";

import { useState, useMemo } from "react";

const yen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;

export default function SelfVsOutsourceCalculator() {
  const [unitCount, setUnitCount] = useState(10);
  const [avgRent, setAvgRent] = useState(70000);
  const [feeRate, setFeeRate] = useState(5);
  const [hoursPerUnitPerMonth, setHoursPerUnitPerMonth] = useState(2);
  const [hourlyValue, setHourlyValue] = useState(3000);

  const result = useMemo(() => {
    const monthlyRevenue = avgRent * unitCount;
    const outsourceMonthlyFee = monthlyRevenue * (feeRate / 100);
    const monthlyHours = hoursPerUnitPerMonth * unitCount;
    const selfMonthlyTimeCost = monthlyHours * hourlyValue;

    const monthlyDelta = selfMonthlyTimeCost - outsourceMonthlyFee;
    const annualDelta = monthlyDelta * 12;

    const breakevenUnits = (() => {
      const rate = feeRate / 100;
      const a = avgRent * rate;
      const b = hoursPerUnitPerMonth * hourlyValue;
      if (a === b) return null;
      if (b - a === 0) return null;
      return b > a ? Math.ceil(1) : null;
    })();

    const breakevenHours = (avgRent * (feeRate / 100)) / hourlyValue;

    const curve = Array.from({ length: 20 }, (_, i) => {
      const units = (i + 1) * 5;
      const rev = avgRent * units;
      const fee = rev * (feeRate / 100);
      const timeCost = hoursPerUnitPerMonth * units * hourlyValue;
      return { units, fee, timeCost };
    });

    return {
      monthlyRevenue,
      outsourceMonthlyFee,
      monthlyHours,
      selfMonthlyTimeCost,
      monthlyDelta,
      annualDelta,
      annualOutsourceFee: outsourceMonthlyFee * 12,
      annualSelfTimeCost: selfMonthlyTimeCost * 12,
      breakevenUnits,
      breakevenHours,
      curve,
      shouldOutsource: monthlyDelta > 0,
    };
  }, [unitCount, avgRent, feeRate, hoursPerUnitPerMonth, hourlyValue]);

  const maxBar = Math.max(
    ...result.curve.map((d) => Math.max(d.fee, d.timeCost)),
    1
  );

  return (
    <div className="rounded-2xl border border-rm-border bg-rm-surface p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-[13px] font-medium text-rm-primary">物件数（戸数）</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={1000}
              value={unitCount}
              onChange={(e) => setUnitCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
            />
            <span className="text-[13px] text-rm-text-muted">戸</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={unitCount}
            onChange={(e) => setUnitCount(Number(e.target.value))}
            className="mt-3 w-full accent-rm-accent-deep"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-rm-primary">平均家賃（月）</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={10000}
              max={500000}
              step={1000}
              value={avgRent}
              onChange={(e) => setAvgRent(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
            />
            <span className="text-[13px] text-rm-text-muted">円</span>
          </div>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-rm-primary">委託料率</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={20}
              step={0.5}
              value={feeRate}
              onChange={(e) => setFeeRate(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
            />
            <span className="text-[13px] text-rm-text-muted">%</span>
          </div>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-rm-primary">
            自主管理に費やす時間（1戸あたり/月）
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={hoursPerUnitPerMonth}
              onChange={(e) => setHoursPerUnitPerMonth(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
            />
            <span className="text-[13px] text-rm-text-muted">時間</span>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[13px] font-medium text-rm-primary">
            あなたの時間単価
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={500}
              max={50000}
              step={500}
              value={hourlyValue}
              onChange={(e) => setHourlyValue(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
            />
            <span className="text-[13px] text-rm-text-muted">円 / 時間</span>
          </div>
          <p className="mt-1 text-[11px] text-rm-text-muted">
            本業の時給換算、または「この時間を空けたら何ができるか」で考えます
          </p>
        </div>
      </div>

      <div
        className={`mt-8 rounded-xl p-6 ${
          result.shouldOutsource
            ? "bg-rm-primary text-rm-bg"
            : "border border-rm-border bg-rm-bg text-rm-primary"
        }`}
      >
        <p
          className={`text-[12px] uppercase tracking-wider ${
            result.shouldOutsource ? "text-rm-bg/60" : "text-rm-text-muted"
          }`}
        >
          現在の条件での結論
        </p>
        <p className="mt-2 text-[24px] font-medium tracking-tight">
          {result.shouldOutsource
            ? "管理委託の方が得"
            : "自主管理の方が得"}
        </p>
        <p
          className={`mt-2 text-[13px] ${
            result.shouldOutsource ? "text-rm-bg/70" : "text-rm-text-secondary"
          }`}
        >
          {result.shouldOutsource
            ? `委託すると月 ${yen(Math.abs(result.monthlyDelta))} お得（年 ${yen(Math.abs(result.annualDelta))}）`
            : `自主管理だと月 ${yen(Math.abs(result.monthlyDelta))} お得（年 ${yen(Math.abs(result.annualDelta))}）`}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-rm-border bg-rm-bg p-5">
          <p className="text-[12px] uppercase tracking-wider text-rm-text-muted">
            自主管理の時間コスト
          </p>
          <p className="mt-2 text-[22px] font-medium text-rm-primary">
            {yen(result.selfMonthlyTimeCost)} / 月
          </p>
          <p className="mt-1 text-[12px] text-rm-text-muted">
            {result.monthlyHours.toFixed(1)} 時間 × {yen(hourlyValue)}
          </p>
        </div>
        <div className="rounded-xl border border-rm-border bg-rm-bg p-5">
          <p className="text-[12px] uppercase tracking-wider text-rm-text-muted">
            管理委託のコスト
          </p>
          <p className="mt-2 text-[22px] font-medium text-rm-primary">
            {yen(result.outsourceMonthlyFee)} / 月
          </p>
          <p className="mt-1 text-[12px] text-rm-text-muted">
            家賃収入 {yen(result.monthlyRevenue)} × {feeRate}%
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-rm-border bg-rm-bg p-5">
        <p className="text-[12px] font-medium text-rm-text-secondary">
          損益分岐の目安
        </p>
        <p className="mt-2 text-[13px] text-rm-primary">
          1戸あたり月 <strong>{result.breakevenHours.toFixed(1)}時間</strong> 以上自主管理に使うなら、委託した方が得になります
        </p>
        <p className="mt-1 text-[11px] text-rm-text-muted">
          ＝ 家賃 {yen(avgRent)} × {feeRate}% ÷ 時間単価 {yen(hourlyValue)}
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-rm-border bg-rm-bg p-5">
        <p className="text-[12px] font-medium text-rm-text-secondary">
          物件数別の月額コスト比較
        </p>
        <div className="mt-4 space-y-3">
          {result.curve.filter((_, i) => i % 2 === 0).slice(0, 7).map((d) => {
            const feeW = (d.fee / maxBar) * 100;
            const timeW = (d.timeCost / maxBar) * 100;
            return (
              <div key={d.units}>
                <p className="text-[11px] text-rm-text-muted">{d.units}戸</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[11px] text-rm-text-muted">委託</span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded bg-rm-border/40">
                    <div className="h-full bg-rm-accent-deep" style={{ width: `${feeW}%` }} />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[11px] text-rm-text-secondary">
                    {yen(d.fee)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[11px] text-rm-text-muted">自主管理</span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded bg-rm-border/40">
                    <div className="h-full bg-rm-primary/60" style={{ width: `${timeW}%` }} />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[11px] text-rm-text-secondary">
                    {yen(d.timeCost)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-rm-border bg-rm-bg p-4 text-[12px] leading-relaxed text-rm-text-muted">
        <p className="font-medium text-rm-text-secondary">この計算の前提</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>自主管理にかかる時間は、入居者対応・家賃集金・修繕手配・確定申告などの平均値で見積もります</li>
          <li>夜間・休日対応のストレスは時間コストに含めにくいので、別途加算して判断します</li>
          <li>管理委託料以外の費用（広告料・更新事務手数料・修繕手配料）は含まれていません</li>
          <li>客付け力・修繕業者ネットワーク・夜間対応の質など、金額に現れない価値も判断材料に</li>
        </ul>
      </div>
    </div>
  );
}
