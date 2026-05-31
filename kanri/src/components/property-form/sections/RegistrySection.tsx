"use client";

import { Section } from "../Section";
import { Label, type EditData } from "../FormPrimitives";

export default function RegistrySection({ editData }: { editData: EditData }) {
  return (
    <Section title="登記情報">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>登記名義人</Label>
          <input
            name="registered_owner_name"
            defaultValue={editData?.registered_owner_name || ""}
            className="input"
            placeholder="例: 山田太郎"
          />
        </div>
        <div>
          <Label>抵当権</Label>
          <select
            name="mortgage_exists"
            defaultValue={editData?.mortgage_exists ? "true" : "false"}
            className="input"
          >
            <option value="false">なし</option>
            <option value="true">あり</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>抵当権者</Label>
          <input
            name="mortgagee"
            defaultValue={editData?.mortgagee || ""}
            className="input"
            placeholder="例: ○○銀行"
          />
        </div>
        <div>
          <Label>抵当権額（円）</Label>
          <input
            name="mortgage_amount"
            type="number"
            defaultValue={editData?.mortgage_amount || ""}
            className="input"
            placeholder="例: 50000000"
          />
        </div>
      </div>
    </Section>
  );
}
