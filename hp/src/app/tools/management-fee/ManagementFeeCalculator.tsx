"use client";

import { useState, useMemo } from "react";
import { useToolLog } from "@/lib/use-tool-log";

type ServiceType = "collection" | "standard" | "full" | "custom";

const SERVICE_OPTIONS: { value: ServiceType; label: string; rateMin: number; rateMax: number; description: string }[] = [
  {
    value: "collection",
    label: "集金代行のみ",
    rateMin: 0.01,
    rateMax: 0.03,
    description: "家賃集金・入金管理のみ。入居者対応はオーナー自身で行う",
  },
  {
    value: "standard",
    label: "標準的な管理委託",
    rateMin: 0.03,
    rateMax: 0.05,
    description: "家賃集金 + 入居者対応 + 修繕手配。最も一般的なフル委託",
  },
  {
    value: "full",
    label: "フルサービス管理",
    rateMin: 0.05,
    rateMax: 0.07,
    description: "標準委託 + 客付け強化・収支報告詳細化など。大手や首都圏で多い",
  },
  {
    value: "custom",
    label: "自分で指定する",
    rateMin: 0,
    rateMax: 0,
    description: "実際の見積もり料率や、想定する料率を直接入力",
  },
];

const yen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;

export default function ManagementFeeCalculator() {
  const [avgRent, setAvgRent] = useState(70000);
  const [unitCount, setUnitCount] = useState(10);
  const [serviceType, setServiceType] = useState<ServiceType>("standard");
  const [customRate, setCustomRate] = useState(4.5);

  const selected = SERVICE_OPTIONS.find((s) => s.value === serviceType)!;

  const result = useMemo(() => {
    const monthlyRevenue = avgRent * unitCount;
    let monthlyFeeMin: number;
    let monthlyFeeMax: number;
    let isPoint: boolean;
    if (serviceType === "custom") {
      const rate = customRate / 100;
      monthlyFeeMin = monthlyRevenue * rate;
      monthlyFeeMax = monthlyFeeMin;
      isPoint = true;
    } else {
      monthlyFeeMin = monthlyRevenue * selected.rateMin;
      monthlyFeeMax = monthlyRevenue * selected.rateMax;
      isPoint = false;
    }
    return {
      monthlyRevenue,
      monthlyFeeMin,
      monthlyFeeMax,
      annualFeeMin: monthlyFeeMin * 12,
      annualFeeMax: monthlyFeeMax * 12,
      isPoint,
    };
  }, [avgRent, unitCount, selected, serviceType, customRate]);

  useToolLog(
    "management-fee",
    { avgRent, unitCount, serviceType, customRate: serviceType === "custom" ? customRate : null },
    {
      monthlyFeeMin: result.monthlyFeeMin,
      monthlyFeeMax: result.monthlyFeeMax,
      monthlyRevenue: result.monthlyRevenue,
    }
  );

  return (
    <div className="rounded-2xl border border-rm-border bg-rm-surface p-6 sm:p-8">
      <div className="space-y-5">
        <div>
          <label className="block text-[13px] font-medium text-rm-primary">
            想定家賃(1戸あたり / 月)
          </label>
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
          <input
            type="range"
            min={30000}
            max={300000}
            step={5000}
            value={avgRent}
            onChange={(e) => setAvgRent(Number(e.target.value))}
            className="mt-3 w-full accent-rm-accent-deep"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-rm-primary">
            戸数
          </label>
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
            step={1}
            value={unitCount}
            onChange={(e) => setUnitCount(Number(e.target.value))}
            className="mt-3 w-full accent-rm-accent-deep"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-rm-primary">
            管理委託の形態
          </label>
          <div className="mt-2 space-y-2">
            {SERVICE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                  serviceType === opt.value
                    ? "border-rm-accent-deep bg-rm-accent-tint/40"
                    : "border-rm-border bg-rm-bg hover:border-rm-border-strong"
                }`}
              >
                <input
                  type="radio"
                  name="serviceType"
                  value={opt.value}
                  checked={serviceType === opt.value}
                  onChange={() => setServiceType(opt.value)}
                  className="mt-1 accent-rm-accent-deep"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-rm-primary">
                      {opt.label}
                    </span>
                    {opt.value !== "custom" && (
                      <span className="text-[11px] text-rm-text-muted">
                        家賃の{(opt.rateMin * 100).toFixed(0)}〜{(opt.rateMax * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] text-rm-text-muted">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {serviceType === "custom" && (
          <div>
            <label className="block text-[13px] font-medium text-rm-primary">
              委託料率
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={30}
                step={0.1}
                value={customRate}
                onChange={(e) => setCustomRate(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-lg border border-rm-border bg-rm-bg px-3 py-2 text-[14px] text-rm-primary focus:border-rm-accent-deep focus:outline-none"
              />
              <span className="text-[13px] text-rm-text-muted">%</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={0.1}
              value={customRate}
              onChange={(e) => setCustomRate(Number(e.target.value))}
              className="mt-3 w-full accent-rm-accent-deep"
            />
            <p className="mt-1 text-[11px] text-rm-text-muted">
              一般的な相場: 集金代行 1〜3% / 標準委託 3〜5% / フルサービス 5〜7% / サブリース 10〜20%
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl bg-rm-primary p-6 text-rm-bg">
        <p className="text-[12px] uppercase tracking-wider text-rm-bg/60">
          月額委託費の目安
        </p>
        <p className="mt-2 text-[26px] font-medium tracking-tight">
          {result.isPoint
            ? yen(result.monthlyFeeMin)
            : `${yen(result.monthlyFeeMin)} 〜 ${yen(result.monthlyFeeMax)}`}
          <span className="ml-2 text-[13px] text-rm-bg/60">/ 月(税別)</span>
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-rm-bg/10 p-3">
            <p className="text-[11px] text-rm-bg/60">家賃収入(満室時)</p>
            <p className="mt-1 text-[15px] font-medium">{yen(result.monthlyRevenue)} / 月</p>
          </div>
          <div className="rounded-lg bg-rm-bg/10 p-3">
            <p className="text-[11px] text-rm-bg/60">年間委託費</p>
            <p className="mt-1 text-[15px] font-medium">
              {result.isPoint
                ? yen(result.annualFeeMin)
                : `${yen(result.annualFeeMin)} 〜 ${yen(result.annualFeeMax)}`}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-rm-border bg-rm-bg p-4 text-[12px] leading-relaxed text-rm-text-muted">
        <p className="font-medium text-rm-text-secondary">この計算の前提</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>委託料率は国土交通省「賃貸住宅管理業務に関するアンケート調査」および業界慣行に基づく一般的なレンジです</li>
          <li>地域・物件規模・管理会社の方針で実際の料率は変動します</li>
          <li>委託料以外に、入居者募集時の広告料(AD)・契約更新事務手数料・退去立会い料・修繕工事手配料が別途発生します</li>
          <li>サブリース(家賃保証型)の場合は手数料が10〜20%と高くなります</li>
        </ul>
      </div>
    </div>
  );
}
