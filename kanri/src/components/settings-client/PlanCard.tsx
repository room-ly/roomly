"use client";

import { Crown, ExternalLink } from "lucide-react";
import type { PlanInfo, PlanOption } from "./constants";

export default function PlanCard({
  plans,
  planInfo,
  checkingOut,
  setCheckingOut,
  customUnits,
  setCustomUnits,
}: {
  plans: PlanOption[];
  planInfo: PlanInfo;
  checkingOut: string | null;
  setCheckingOut: (v: string | null) => void;
  customUnits: string;
  setCustomUnits: (v: string) => void;
}) {
  return (
    <div className="card p-5 mb-4">
      <h2 className="text-[14px] font-semibold mb-4">プラン</h2>

      {/* 現在のプラン状況 */}
      <div className="p-4 rounded-lg bg-bg-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {planInfo.isSubscriptionActive ? (
              <div className="w-8 h-8 rounded-full bg-accent-tint flex items-center justify-center">
                <Crown size={15} className="text-accent-deep" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-bg-2 border border-line flex items-center justify-center">
                <span className="text-[11px] text-ink-3 font-medium">Free</span>
              </div>
            )}
            <div>
              <p className="text-[13px] font-semibold">
                {planInfo.isSubscriptionActive
                  ? `〜${planInfo.maxUnits.toLocaleString()}区画プラン`
                  : "フリープラン"}
              </p>
              <p className="text-[12px] text-ink-3 mt-0.5">
                {planInfo.currentUnits}区画 / {planInfo.maxUnits.toLocaleString()}区画
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {planInfo.isSubscriptionActive && planInfo.periodEnd && (
              <p className="text-[11px] text-ink-3">
                次回更新 {new Date(planInfo.periodEnd).toLocaleDateString("ja-JP")}
              </p>
            )}
            {planInfo.hasStripeCustomer && (
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/stripe/portal", { method: "POST" });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                }}
                className="flex items-center gap-1 text-[12px] text-accent-deep hover:underline"
              >
                請求管理 <ExternalLink size={11} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full h-1.5 rounded-full bg-line overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{
                width: `${Math.min((planInfo.currentUnits / planInfo.maxUnits) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 料金テーブル */}
      {plans.length > 0 && (() => {
        const isFreeCurrent = !planInfo.isSubscriptionActive;
        const upgradePlans = planInfo.isSubscriptionActive
          ? plans.filter((p) => p.maxUnits > planInfo.maxUnits)
          : plans;
        return (
          <div>
            <p className="text-[13px] text-ink-2 mb-3">
              区画数に応じた月額料金です。全プランで全機能が使えます。
            </p>
            <div className="rounded-lg border border-line overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-bg-2 text-ink-3 text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left font-medium">区画数</th>
                    <th className="px-4 py-2.5 text-right font-medium">月額（税込）</th>
                    <th className="px-4 py-2.5 w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {isFreeCurrent && (
                    <tr className="border-t border-line bg-accent-tint/30">
                      <td className="px-4 py-3 font-medium">〜10区画</td>
                      <td className="px-4 py-3 text-right font-semibold">¥0</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[12px] text-accent-deep font-medium">利用中</span>
                      </td>
                    </tr>
                  )}
                  {planInfo.isSubscriptionActive &&
                    plans
                      .filter((p) => p.maxUnits === planInfo.maxUnits)
                      .map((plan) => (
                        <tr key={plan.priceId} className="border-t border-line bg-accent-tint/30">
                          <td className="px-4 py-3 font-medium">
                            〜{plan.maxUnits.toLocaleString()}区画
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">
                            ¥{plan.price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-[12px] text-accent-deep font-medium">利用中</span>
                          </td>
                        </tr>
                      ))}
                  {upgradePlans.map((plan) => (
                    <tr
                      key={plan.priceId}
                      className="border-t border-line transition-colors hover:bg-bg-2/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        〜{plan.maxUnits.toLocaleString()}区画
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        ¥{plan.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={checkingOut !== null}
                          onClick={async () => {
                            setCheckingOut(plan.priceId);
                            const res = await fetch("/api/stripe/checkout", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ priceId: plan.priceId }),
                            });
                            const data = await res.json();
                            if (data.url) {
                              window.location.href = data.url;
                            } else {
                              alert(data.detail || data.error || "エラーが発生しました");
                              setCheckingOut(null);
                            }
                          }}
                          className="text-[12px] font-medium text-white bg-accent hover:bg-accent-deep rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
                        >
                          {checkingOut === plan.priceId ? "処理中..." : "選択"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-line transition-colors hover:bg-bg-2/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">2,001区画〜</p>
                      <p className="text-[11px] text-ink-3 mt-0.5">
                        1,000区画ごとに+¥5,000（税込）/月
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          min={3000}
                          step={1000}
                          placeholder="3000"
                          value={customUnits}
                          onChange={(e) => setCustomUnits(e.target.value)}
                          className="input w-24 text-right text-[13px] tabular-nums"
                        />
                        <span className="text-[12px] text-ink-3">区画</span>
                      </div>
                      {customUnits && Number(customUnits) > 2000 && (
                        <p className="text-[12px] font-semibold tabular-nums mt-1">
                          ¥
                          {(
                            30000 +
                            Math.ceil((Number(customUnits) - 2000) / 1000) * 5000
                          ).toLocaleString()}
                          /月
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={
                          checkingOut !== null || !customUnits || Number(customUnits) <= 2000
                        }
                        onClick={async () => {
                          const units = Number(customUnits);
                          if (units <= 2000) return;
                          setCheckingOut("custom");
                          const res = await fetch("/api/stripe/checkout", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ maxUnits: units }),
                          });
                          const data = await res.json();
                          if (data.url) {
                            window.location.href = data.url;
                          } else {
                            alert(data.detail || data.error || "エラーが発生しました");
                            setCheckingOut(null);
                          }
                        }}
                        className="text-[12px] font-medium text-white bg-accent hover:bg-accent-deep rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
                      >
                        {checkingOut === "custom" ? "処理中..." : "選択"}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {planInfo.hasStripeCustomer && (
              <p className="text-[11px] text-ink-3 mt-1">
                現在のプランの変更・解約は「請求管理」から行えます。
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
