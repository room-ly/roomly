"use client";

export type SplitMode = "owner" | "company" | "tenant" | "custom";

const MODES: SplitMode[] = ["company", "owner", "tenant", "custom"];
const LABEL: Record<SplitMode, string> = {
  company: "100%自社",
  owner: "100%オーナー",
  tenant: "100%入居者",
  custom: "カスタム",
};

export default function SplitModeSection({
  splitMode,
  setSplitMode,
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
  splitMode: SplitMode;
  setSplitMode: (m: SplitMode) => void;
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
  return (
    <div>
      <label className="text-sm font-medium text-ink-2 block mb-1.5">負担区分</label>
      <div className="flex rounded-lg border border-line overflow-hidden mb-2">
        {MODES.map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => setSplitMode(m)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              splitMode === m ? "bg-accent text-white" : "bg-surface text-ink-3 hover:bg-bg-2"
            }`}
          >
            {LABEL[m]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] text-ink-3 block mb-1">オーナー負担</label>
          <input
            type="number"
            value={ownerAmount || 0}
            disabled={splitMode !== "custom"}
            onChange={(e) => setOwnerAmount(Number(e.target.value) || 0)}
            className="input"
          />
        </div>
        <div>
          <label className="text-[11px] text-ink-3 block mb-1">入居者負担</label>
          <input
            type="number"
            value={tenantAmount || 0}
            disabled={splitMode !== "custom"}
            onChange={(e) => setTenantAmount(Number(e.target.value) || 0)}
            className="input"
          />
        </div>
        <div>
          <label className="text-[11px] text-ink-3 block mb-1">自社負担</label>
          <input
            type="number"
            value={companyAmount || 0}
            disabled={splitMode !== "custom"}
            onChange={(e) => setCompanyAmount(Number(e.target.value) || 0)}
            className="input"
          />
        </div>
      </div>
      <p className={`text-[11px] mt-1 ${breakdownOk ? "text-ink-3" : "text-danger"}`}>
        内訳合計: ¥{sumBreakdown.toLocaleString()} / 金額: ¥{amount.toLocaleString()}
        {!breakdownOk && " — 一致しません"}
      </p>
    </div>
  );
}
