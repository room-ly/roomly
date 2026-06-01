"use client";

type Company = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export default function NotificationCard({ company }: { company: Company }) {
  return (
    <div className="card p-5 mb-4">
      <h2 className="text-[14px] font-semibold mb-4">通知・表示設定</h2>

      <div className="mb-5">
        <label className="block text-[13px] font-medium text-ink-2 mb-1">契約満了アラート</label>
        <p className="text-[12px] text-ink-3 mb-2">
          契約終了日までの残り日数がこの値以下になるとバッジを表示します
        </p>
        <select
          name="contract_alert_days"
          defaultValue={company?.contract_alert_days ?? 90}
          className="input"
          style={{ width: "12rem" }}
        >
          <option value="30">30日前</option>
          <option value="60">60日前</option>
          <option value="90">90日前（デフォルト）</option>
          <option value="120">120日前</option>
          <option value="180">180日前（半年前）</option>
        </select>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-ink-2 mb-1">家賃回収率の目標値</label>
        <p className="text-[12px] text-ink-3 mb-2">
          ダッシュボードの「家賃回収率 月次推移」グラフに目標ラインとして表示します
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="rent_collection_target_rate"
            min={0}
            max={100}
            step={1}
            defaultValue={company?.rent_collection_target_rate ?? 95}
            className="input"
            style={{ width: "6rem" }}
          />
          <span className="text-[13px] text-ink-2">%</span>
        </div>
      </div>
    </div>
  );
}
