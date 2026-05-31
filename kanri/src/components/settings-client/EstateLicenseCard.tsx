"use client";

type Company = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export default function EstateLicenseCard({ company }: { company: Company }) {
  return (
    <div className="card p-5 mb-4">
      <h2 className="text-[14px] font-semibold mb-1">宅建業者情報</h2>
      <p className="text-[12px] text-ink-3 mb-4">契約書・重要事項説明書に印字されます</p>
      <div className="space-y-3">
        <div>
          <label className="block text-[13px] font-medium text-ink-2 mb-1">
            宅地建物取引業者免許番号
          </label>
          <input
            name="estate_license"
            type="text"
            defaultValue={company?.estate_license || ""}
            className="input"
            placeholder="例: 国土交通大臣（1）第000000号"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-ink-2 mb-1">
            専任宅地建物取引士 氏名
          </label>
          <input
            name="estate_agent_name"
            type="text"
            defaultValue={company?.estate_agent_name || ""}
            className="input"
            placeholder="例: 山田 太郎"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-ink-2 mb-1">
            取引士証 登録番号
          </label>
          <input
            name="estate_agent_license"
            type="text"
            defaultValue={company?.estate_agent_license || ""}
            className="input"
            placeholder="例: 東京都知事登録（1）第000000号"
          />
        </div>
      </div>
    </div>
  );
}
