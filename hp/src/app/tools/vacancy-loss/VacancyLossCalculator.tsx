"use client";

import { useState, useMemo } from "react";

const yen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;

export default function VacancyLossCalculator() {
  const [monthlyRent, setMonthlyRent] = useState(70000);
  const [commonFee, setCommonFee] = useState(5000);
  const [vacancyMonths, setVacancyMonths] = useState(3);
  const [adMonths, setAdMonths] = useState(1);
  const [unitCount, setUnitCount] = useState(1);

  const result = useMemo(() => {
    const monthlyIncome = monthlyRent + commonFee;
    const rentLoss = monthlyIncome * vacancyMonths * unitCount;
    const adCost = monthlyRent * adMonths * unitCount;
    const annualOpportunityLoss = monthlyIncome * 12 * unitCount;
    const totalLoss = rentLoss + adCost;
    const breakdownData = Array.from({ length: Math.max(1, Math.ceil(vacancyMonths)) }, (_, i) => {
      const m = i + 1;
      return {
        month: m,
        cumulativeLoss: monthlyIncome * Math.min(m, vacancyMonths) * unitCount,
      };
    });
    return {
      monthlyIncome,
      rentLoss,
      adCost,
      totalLoss,
      annualOpportunityLoss,
      lossRatioOfAnnual: (totalLoss / annualOpportunityLoss) * 100,
      breakdownData,
    };
  }, [monthlyRent, commonFee, vacancyMonths, adMonths, unitCount]);

  const maxBar = Math.max(...result.breakdownData.map((d) => d.cumulativeLoss), 1);

  return (
    <div className="rounded-2xl border border-rm-border bg-rm-surface p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-[13px] font-medium text-rm-primary">月額家賃</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              step={1000}
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
            />
            <span className="text-[13px] text-rm-text-muted">円</span>
          </div>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-rm-primary">共益費</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              step={500}
              value={commonFee}
              onChange={(e) => setCommonFee(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
            />
            <span className="text-[13px] text-rm-text-muted">円</span>
          </div>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-rm-primary">
            空室期間
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={24}
              step={1}
              value={vacancyMonths}
              onChange={(e) => setVacancyMonths(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
            />
            <span className="whitespace-nowrap text-[13px] text-rm-text-muted">ヶ月</span>
          </div>
          <input
            type="range"
            min={0}
            max={12}
            value={vacancyMonths}
            onChange={(e) => setVacancyMonths(Number(e.target.value))}
            className="mt-3 w-full accent-rm-accent-deep"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-rm-primary">
            広告料(AD)
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={3}
              step={0.5}
              value={adMonths}
              onChange={(e) => setAdMonths(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
            />
            <span className="whitespace-nowrap text-[13px] text-rm-text-muted">ヶ月分</span>
          </div>
          <p className="mt-1 text-[11px] text-rm-text-muted">家賃の何ヶ月分を客付け業者に支払うか</p>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[13px] font-medium text-rm-primary">対象戸数</label>
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
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-rm-primary p-6 text-rm-bg">
        <p className="text-[12px] uppercase tracking-wider text-rm-bg/60">空室による合計損失</p>
        <p className="mt-2 text-[30px] font-medium tracking-tight">
          {yen(result.totalLoss)}
        </p>
        <p className="mt-2 text-[12px] text-rm-bg/60">
          年間家賃収入の {result.lossRatioOfAnnual.toFixed(1)}% に相当
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-rm-bg/10 p-3">
            <p className="text-[11px] text-rm-bg/60">家賃の機会損失</p>
            <p className="mt-1 text-[15px] font-medium">{yen(result.rentLoss)}</p>
          </div>
          <div className="rounded-lg bg-rm-bg/10 p-3">
            <p className="text-[11px] text-rm-bg/60">募集時の広告料</p>
            <p className="mt-1 text-[15px] font-medium">{yen(result.adCost)}</p>
          </div>
        </div>
      </div>

      {result.breakdownData.length > 1 && (
        <div className="mt-6 rounded-xl border border-rm-border bg-rm-bg p-5">
          <p className="text-[12px] font-medium text-rm-text-secondary">月別の累計損失</p>
          <div className="mt-4 space-y-2">
            {result.breakdownData.map((d) => {
              const width = (d.cumulativeLoss / maxBar) * 100;
              return (
                <div key={d.month} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-[11px] text-rm-text-muted">
                    {d.month}ヶ月
                  </span>
                  <div className="relative h-6 flex-1 overflow-hidden rounded bg-rm-border/40">
                    <div
                      className="h-full bg-rm-accent-deep transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-[11px] text-rm-text-secondary">
                    {yen(d.cumulativeLoss)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-rm-border bg-rm-bg p-4 text-[12px] leading-relaxed text-rm-text-muted">
        <p className="font-medium text-rm-text-secondary">この計算の前提</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>家賃・共益費・広告料の単純合計です。原状回復費・修繕費は含みません</li>
          <li>広告料(AD)は客付け業者へのインセンティブで、首都圏では家賃1ヶ月分が一般的</li>
          <li>礼金収入や敷金から差し引ける費用は考慮していません</li>
          <li>長期空室時は家賃下落・設備更新費・固定資産税の負担も実質的な損失に加わります</li>
        </ul>
      </div>
    </div>
  );
}
