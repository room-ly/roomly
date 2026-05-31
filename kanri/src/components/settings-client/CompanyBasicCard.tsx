"use client";

import PostalCodeInput from "../PostalCodeInput";

type Company = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export default function CompanyBasicCard({
  company,
  address,
  setAddress,
}: {
  company: Company;
  address: string;
  setAddress: (v: string) => void;
}) {
  return (
    <div className="card p-5 mb-4">
      <h2 className="text-[14px] font-semibold mb-4">基本情報</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-[13px] font-medium text-ink-2 mb-1">会社名 / 氏名</label>
          <input name="name" type="text" defaultValue={company?.name || ""} className="input" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-ink-2 mb-1">電話番号</label>
          <input name="phone" type="text" defaultValue={company?.phone || ""} className="input" />
        </div>
        <div className="flex gap-2">
          <div className="w-44">
            <label className="block text-[13px] font-medium text-ink-2 mb-1">郵便番号</label>
            <PostalCodeInput
              defaultValue={company?.postal_code || ""}
              placeholder="例: 150-0001"
              onResolved={(r) => setAddress(r.address)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-[13px] font-medium text-ink-2 mb-1">住所</label>
            <input
              name="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
